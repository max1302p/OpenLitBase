import { authModeSchema } from '@litbase/shared'
import { z } from 'zod'

const emptyToUndefined = (v: unknown) => (v === '' ? undefined : v)
const optionalString = z.preprocess(emptyToUndefined, z.string().optional())

const envSchema = z
  .object({
    AUTH_MODE: authModeSchema.default('single'),
    BASE_URL: z.url().default('https://localhost:1450'),
    DATABASE_URL: z.string().min(1).default('postgres://litbase:litbase@localhost:5432/litbase'),
    AUTH_SECRET: optionalString,
    ADMIN_EMAILS: z
      .string()
      .default('')
      .transform((s) =>
        s
          .split(',')
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean),
      ),
    SMTP_HOST: optionalString,
    SMTP_PORT: z.preprocess(emptyToUndefined, z.coerce.number().int().optional()),
    SMTP_USER: optionalString,
    SMTP_PASS: optionalString,
    SMTP_FROM: optionalString,
    /** Im Container /data/uploads (docker-compose), lokal apps/api/data/uploads. Mit S3 nur noch Quelle für die Übernahme. */
    UPLOAD_DIR: z.string().default('data/uploads'),
    /** PDFs und Logos auf S3 (Garage, MinIO, AWS …): aktiv, sobald Bucket und Zugangsdaten gesetzt sind. */
    S3_ENDPOINT: optionalString,
    S3_REGION: z.preprocess(emptyToUndefined, z.string().default('auto')),
    S3_BUCKET: optionalString,
    S3_ACCESS_KEY_ID: optionalString,
    S3_SECRET_ACCESS_KEY: optionalString,
    /** Pfad-Adressierung (Bucket im Pfad statt als Subdomain) – für Garage und MinIO nötig. */
    S3_FORCE_PATH_STYLE: z.preprocess(emptyToUndefined, z.enum(['true', 'false']).default('true').transform((v) => v === 'true')),
    /** Nächtliche Datenbank-Sicherung (pg_dump) in diesen Bucket; nutzt die S3-Zugangsdaten. */
    BACKUP_S3_BUCKET: optionalString,
    BACKUP_RETENTION_DAYS: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).default(14)),
    /** Stunde (UTC) der täglichen Sicherung. */
    BACKUP_HOUR: z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).max(23).default(2)),
    /** Mitgelieferte CSL-Styles (Default: packages/citation/styles bzw. /app/styles im Image). */
    STYLES_DIR: optionalString,
    /** Eigene CSL-Styles: `.csl`-Datei ablegen, fertig (Locales in `<ordner>/locales`). */
    CUSTOM_STYLES_DIR: z.string().default('data/styles'),
    /** 1450 – um dieses Jahr erfand Gutenberg den Buchdruck; der Port ist fast nie belegt. */
    PORT: z.coerce.number().int().default(1450),
    /**
     * HTTPS direkt im Container (Word lädt Add-ins nur über https): `auto` bei lokaler
     * https-BASE_URL (localhost, IP im lokalen Netz, *.local), `on` immer, `off` nie (Reverse-Proxy).
     */
    TLS: z.enum(['auto', 'on', 'off']).default('auto'),
    /** Lokale CA und Serverzertifikat (im Container /data/certs). */
    CERT_DIR: z.string().default('data/certs'),
    /**
     * Rechtstexte der Betreiberin (nur gehostet sinnvoll): erscheinen auf der Login-Seite, im Konto-Menü
     * und in allen E-Mails. Mit Nutzungsbedingungen oder Datenschutzerklärung ist bei der
     * Registrierung eine Zustimmung nötig (Zeitpunkt wird gespeichert).
     */
    LEGAL_IMPRINT_URL: z.preprocess(emptyToUndefined, z.url().optional()),
    LEGAL_PRIVACY_URL: z.preprocess(emptyToUndefined, z.url().optional()),
    LEGAL_TERMS_URL: z.preprocess(emptyToUndefined, z.url().optional()),
    /** Avatar-Server (DiceBear-API mit Version, z. B. eigener Server); Standard: öffentliches DiceBear. */
    AVATAR_URL: z.preprocess(emptyToUndefined, z.url().default('https://api.dicebear.com/10.x')),
    /** Quellcode dieser Version – bei veränderten Versionen auf den eigenen Code zeigen (AGPL § 13). */
    SOURCE_URL: z.preprocess(emptyToUndefined, z.url().default('https://github.com/max1302p/OpenLitBase')),
    /**
     * Update-Prüfung: fragt beim Start und täglich nach der neuesten Version und sendet dabei nur
     * Version, Modus und eine zufällige Instanz-ID. `off` schaltet sie ab.
     */
    UPDATE_CHECK: z.preprocess(emptyToUndefined, z.enum(['on', 'off']).default('on')),
    UPDATE_CHECK_URL: z.preprocess(emptyToUndefined, z.url().default('https://get.openlitbase.de/version.json')),
    /** Verzeichnis mit den gebauten Frontends (web/, addin/). */
    PUBLIC_DIR: z.string().default('./public'),
  })
  .superRefine((env, ctx) => {
    if (env.AUTH_MODE === 'multi' && (!env.AUTH_SECRET || env.AUTH_SECRET.length < 32)) {
      ctx.addIssue({
        code: 'custom',
        path: ['AUTH_SECRET'],
        message: 'Im Modus "multi" ist AUTH_SECRET Pflicht (mind. 32 Zeichen, z. B. `openssl rand -base64 32`).',
      })
    }
  })

export type Env = z.infer<typeof envSchema>

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    console.error('Ungültige Umgebungsvariablen:\n' + z.prettifyError(result.error))
    process.exit(1)
  }
  return result.data
}

export const env = loadEnv()

/** S3 für Dateien aktiv? Sonst bleibt alles in UPLOAD_DIR. */
export const s3Configured = Boolean(env.S3_BUCKET && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY)
/** Registrierung nur mit Zustimmung zu Nutzungsbedingungen bzw. Datenschutzerklärung? */
export const consentRequired = env.AUTH_MODE === 'multi' && Boolean(env.LEGAL_TERMS_URL || env.LEGAL_PRIVACY_URL)
/** Datenbank-Sicherung aktiv? */
export const backupConfigured = Boolean(env.BACKUP_S3_BUCKET && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY)
