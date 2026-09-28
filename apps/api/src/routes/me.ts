import { de, type Me } from '@litbase/shared'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { deleteAccount } from '../account/delete-account'
import { logoUrl } from '../admin/logos'
import { isAdminEmail } from '../auth/access'
import { getAuth } from '../auth/better-auth'
import { matchDomain } from '../auth/domains'
import { accountDeletedEmail } from '../auth/emails'
import { sendMail } from '../auth/mailer'
import { db } from '../db/client'
import { account, allowedDomains } from '../db/schema'
import { env } from '../env'
import { validate } from '../lib/validate'
import { storage } from '../storage'
import { getUpdateStatus } from '../update-check'
import type { AppEnv } from '../types'

async function institutionFor(email: string): Promise<Me['institution']> {
  if (env.AUTH_MODE !== 'multi') return null
  const domain = matchDomain(email, await db.select().from(allowedDomains))
  return domain ? { name: domain.name, logoUrl: logoUrl(domain.id, domain.logoPath) } : null
}

/** Passwort des Kontos prüfen (better-auth speichert es im Credential-Account). */
async function passwordMatches(userId: string, password: string) {
  const [row] = await db
    .select({ hash: account.password })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, 'credential')))
  if (!row?.hash) return false
  const ctx = await getAuth().$context
  return ctx.password.verify({ hash: row.hash, password })
}

export const meRoutes = new Hono<AppEnv>()
  .get('/', async (c) => {
    const { id, email, name } = c.var.user
    const isAdmin = env.AUTH_MODE === 'multi' && isAdminEmail(email)
    return c.json({ id, email, name, isAdmin, institution: await institutionFor(email) } satisfies Me)
  })
  /** Update-Hinweis: nur für Admins bzw. im Modus "single" (dort gibt es nur den lokalen User). */
  .get('/update', (c) => {
    if (env.AUTH_MODE === 'multi' && !isAdminEmail(c.var.user.email)) return c.json({ error: de.errors.adminOnly }, 403)
    return c.json(getUpdateStatus())
  })
  /** Eigenes Konto endgültig löschen – nur im Modus "multi" und nur mit Passwort. */
  .delete('/', validate('json', z.object({ password: z.string().min(1).max(200) })), async (c) => {
    if (env.AUTH_MODE !== 'multi') return c.json({ error: de.errors.notAvailable }, 400)
    const { id, email, name } = c.var.user
    if (!(await passwordMatches(id, c.req.valid('json').password))) {
      return c.json({ error: de.settings.deleteWrongPassword, code: 'WRONG_PASSWORD' }, 403)
    }
    const files = await deleteAccount(id, email)
    // Dateien nach dem Commit; bleibt eine liegen, räumt der tägliche Lauf sie weg.
    await storage.delete(files).catch((error) => console.error('✖ Dateien des gelöschten Kontos:', error))
    await sendMail({ to: email, ...accountDeletedEmail(name) }).catch(() => undefined)
    return c.body(null, 204)
  })
