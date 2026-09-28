import { de } from '@litbase/shared'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { APIError, createAuthMiddleware, isAPIError } from 'better-auth/api'
import { db } from '../db/client'
import * as schema from '../db/schema'
import { consentRequired, env } from '../env'
import { eq } from 'drizzle-orm'
import { hasAccess, isAdminEmail } from './access'
import { isEmailDomainAllowed, listActiveDomains } from './domains'
import { passwordChangedEmail, resetPasswordEmail, verificationEmail } from './emails'
import { claimInvitations } from '../projects/members'
import { sendMail } from './mailer'

/** Ziel des Bestätigungslinks (Web-App leitet angemeldete User weiter). */
const VERIFY_CALLBACK = '/login'

/** Im Dev läuft die Web-App auf :5173 und spricht die API über den Vite-Proxy an. */
const devOrigins = process.env.NODE_ENV === 'production' ? [] : ['http://localhost:5173']

function createAuth() {
  return betterAuth({
    baseURL: env.BASE_URL,
    basePath: '/api/auth',
    secret: env.AUTH_SECRET,
    trustedOrigins: [env.BASE_URL, ...devOrigins],
    database: drizzleAdapter(db, { provider: 'pg', schema }),
    telemetry: { enabled: false },
    // Client-IP für das Rate-Limiting: hinter Traefik/Coolify aus X-Forwarded-For, lokal setzt
    // app.ts die IP der Verbindung in denselben Header.
    advanced: { ipAddress: { ipAddressHeaders: ['x-forwarded-for'] } },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      revokeSessionsOnPasswordReset: true,
      // Erneute Registrierung mit noch unbestätigter Adresse: Bestätigungslink neu schicken
      // (verrät nichts, die Mail geht nur an den Inhaber der Adresse).
      onExistingUserSignUp: async ({ user }) => {
        if (user.emailVerified) return
        await getAuth().api.sendVerificationEmail({ body: { email: user.email, callbackURL: VERIFY_CALLBACK } })
      },
      sendResetPassword: async ({ user, url }) => {
        await sendMail({ to: user.email, ...resetPasswordEmail(user.name, url) })
      },
      // Sicherheitshinweis nach dem Zurücksetzen – fällt jemand Fremdes auf, merkt man es.
      onPasswordReset: async ({ user }) => {
        await sendMail({ to: user.email, ...passwordChangedEmail(user.name) }).catch(() => undefined)
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await sendMail({ to: user.email, ...verificationEmail(user.name, url) })
      },
    },
    user: {
      // Zeitpunkt der Zustimmung zu Nutzungsbedingungen/Datenschutz (nur serverseitig gesetzt).
      additionalFields: { termsAcceptedAt: { type: 'date', required: false, input: false } },
    },
    hooks: {
      // Registrierung nur mit Zustimmung, wenn die Betreiberin Rechtstexte hinterlegt hat (LEGAL_*).
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== '/sign-up/email' || !consentRequired) return
        if ((ctx.body as { acceptTerms?: unknown } | undefined)?.acceptTerms !== true) {
          throw new APIError('BAD_REQUEST', { code: 'CONSENT_REQUIRED', message: de.auth.consentRequired })
        }
      }),
      // Hinweis-Mail auch beim Ändern in den Einstellungen (Zurücksetzen: onPasswordReset).
      after: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== '/change-password' || isAPIError(ctx.context.returned)) return
        const user = ctx.context.session?.user
        if (user) await sendMail({ to: user.email, ...passwordChangedEmail(user.name) }).catch(() => undefined)
      }),
    },
    databaseHooks: {
      // Keine neue Session für gesperrte Konten (Institution deaktiviert).
      session: {
        create: {
          before: async (session) => {
            const [owner] = await db.select({ email: schema.user.email }).from(schema.user).where(eq(schema.user.id, session.userId))
            if (owner && (await hasAccess(owner.email))) return
            throw new APIError('FORBIDDEN', { code: 'ACCOUNT_BLOCKED', message: de.errors.accountBlocked })
          },
        },
      },
      user: {
        create: {
          // Registrierung nur für freigegebene Domains (inkl. Subdomains). Bewusst 400 statt 403:
          // better-auth beantwortet 403 bei Sign-up mit einer Schein-Erfolgsmeldung (Enumeration-Schutz),
          // die Domainliste ist aber ohnehin öffentlich und die Person soll eine klare Meldung sehen.
          before: async (user) => {
            if (!isAdminEmail(user.email) && !(await isEmailDomainAllowed(user.email))) {
              const domains = (await listActiveDomains()).map((d) => d.domain)
              throw new APIError('BAD_REQUEST', { code: 'DOMAIN_NOT_ALLOWED', message: de.auth.domainNotAllowed(domains) })
            }
            // Die Zustimmung hat der before-Hook von /sign-up/email geprüft.
            return { data: { ...user, termsAcceptedAt: consentRequired ? new Date() : null } }
          },
          // Offene Projekteinladungen an diese Adresse dem neuen Konto zuordnen.
          after: async (user) => {
            await claimInvitations(user.id, user.email)
          },
        },
      },
    },
  })
}

let instance: ReturnType<typeof createAuth> | undefined

/** Wird nur im Modus "multi" erzeugt – better-auth verlangt dort ein AUTH_SECRET. */
export function getAuth() {
  instance ??= createAuth()
  return instance
}
