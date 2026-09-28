import { constants } from 'node:fs'
import { access, mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'
import { listActiveDomains } from '../auth/domains'
import { verifyMailer } from '../auth/mailer'
import { styles } from '../citation/styles'
import { latestBackup } from '../backup'
import { backupConfigured, env } from '../env'
import { storage } from '../storage'
import type { TlsSetup } from '../tls/local-certificate'

export type CheckStatus = 'ok' | 'warn' | 'error' | 'info'

export interface Check {
  status: CheckStatus
  label: string
  detail: string
}

/** Pfade im Arbeitsverzeichnis kurz anzeigen (z. B. data/uploads), sonst absolut (/data/uploads). */
function displayPath(dir: string) {
  const relative = path.relative(process.cwd(), path.resolve(dir))
  return relative && !relative.startsWith('..') ? relative : path.resolve(dir)
}

async function isWritable(dir: string) {
  try {
    await mkdir(dir, { recursive: true })
    await access(dir, constants.W_OK)
    return true
  } catch {
    return false
  }
}

async function countCustomStyles() {
  try {
    return (await readdir(env.CUSTOM_STYLES_DIR)).filter((f) => f.endsWith('.csl')).length
  } catch {
    return 0
  }
}

async function frontendCheck(): Promise<Check> {
  const built = async (name: string) => {
    try {
      await access(path.resolve(env.PUBLIC_DIR, name, 'index.html'))
      return true
    } catch {
      return false
    }
  }
  const [web, addin] = await Promise.all([built('web'), built('addin')])
  if (web && addin) return { status: 'ok', label: 'Frontends', detail: 'Web-App unter /, Word-Add-in unter /addin' }
  return { status: 'info', label: 'Frontends', detail: 'nicht gebaut – im Dev liefert Vite die Web-App (:5173)' }
}

/** Word lädt Add-ins nur über https – mit eigener CA im Container oder hinter einem Reverse-Proxy. */
function httpsCheck(tls: TlsSetup | undefined): Check {
  if (tls) {
    const until = tls.validTo.toLocaleDateString('de-CH')
    return { status: 'ok', label: 'Zertifikat', detail: `lokale CA bis ${until} · /openlitbase-ca.crt` }
  }
  if (env.BASE_URL.startsWith('https://')) return { status: 'ok', label: 'Zertifikat', detail: 'vom Reverse-Proxy' }
  return { status: 'info', label: 'Word-Add-in', detail: 'braucht https – BASE_URL=https://localhost:1450 setzen' }
}

async function uploadsCheck(): Promise<Check> {
  if (storage.kind === 's3') {
    return (await storage.check())
      ? { status: 'ok', label: 'Uploads', detail: `S3 ${storage.label}` }
      : { status: 'error', label: 'Uploads', detail: `S3 ${storage.label} nicht erreichbar` }
  }
  return (await isWritable(env.UPLOAD_DIR))
    ? { status: 'ok', label: 'Uploads', detail: displayPath(env.UPLOAD_DIR) }
    : { status: 'error', label: 'Uploads', detail: `${displayPath(env.UPLOAD_DIR)} nicht beschreibbar` }
}

async function backupCheck(): Promise<Check> {
  if (!backupConfigured) {
    return env.AUTH_MODE === 'multi'
      ? { status: 'warn', label: 'Sicherung', detail: 'keine – BACKUP_S3_BUCKET und S3-Zugangsdaten setzen' }
      : { status: 'info', label: 'Sicherung', detail: 'optional über BACKUP_S3_BUCKET' }
  }
  try {
    const last = await latestBackup()
    const when = last ? last.date.toISOString().slice(0, 16).replace('T', ' ') + ' UTC' : 'noch keine'
    return { status: 'ok', label: 'Sicherung', detail: `täglich ${env.BACKUP_HOUR} Uhr UTC → ${env.BACKUP_S3_BUCKET}, letzte: ${when}` }
  } catch {
    return { status: 'error', label: 'Sicherung', detail: `${env.BACKUP_S3_BUCKET} nicht erreichbar` }
  }
}

/** Gemeinsame Checks für beide Modi. */
async function commonChecks(tls: TlsSetup | undefined): Promise<Check[]> {
  const custom = await countCustomStyles()
  const total = styles.listStyles().length
  return [
    { status: 'ok', label: 'Datenbank', detail: 'verbunden, Migrationen aktuell' },
    {
      status: 'ok',
      label: 'Zitierstile',
      detail: `${total} verfügbar${custom ? ` (davon ${custom} eigene)` : ''}`,
    },
    await uploadsCheck(),
    await backupCheck(),
    env.UPDATE_CHECK === 'on'
      ? { status: 'ok', label: 'Updates', detail: `Prüfung aktiv (${new URL(env.UPDATE_CHECK_URL).host}, UPDATE_CHECK=off schaltet ab)` }
      : { status: 'info', label: 'Updates', detail: 'Prüfung ausgeschaltet' },
    await frontendCheck(),
    httpsCheck(tls),
  ]
}

/** Zusätzliche Checks im gehosteten Modus: Mail, Secret, HTTPS, Admins, Domains. */
async function multiChecks(): Promise<Check[]> {
  const mail = await verifyMailer()
  const domains = await listActiveDomains()
  const isLocal = /^http:\/\/(localhost|127\.0\.0\.1)/.test(env.BASE_URL)
  return [
    mail.status === 'ok'
      ? { status: 'ok', label: 'Mailservice', detail: `aktiviert (${mail.target})` }
      : mail.status === 'missing'
        ? { status: 'warn', label: 'Mailservice', detail: 'kein SMTP_HOST – E-Mails landen nur im Log' }
        : { status: 'error', label: 'Mailservice', detail: `${mail.target} – ${mail.error}` },
    { status: 'ok', label: 'Auth-Secret', detail: 'gesetzt' },
    env.BASE_URL.startsWith('https://') || isLocal
      ? { status: 'ok', label: 'HTTPS', detail: isLocal ? 'lokal (http erlaubt)' : 'aktiv' }
      : { status: 'warn', label: 'HTTPS', detail: 'BASE_URL ohne https – Cookies sind nicht „Secure“' },
    env.ADMIN_EMAILS.length > 0
      ? { status: 'ok', label: 'Admins', detail: env.ADMIN_EMAILS.join(', ') }
      : { status: 'warn', label: 'Admins', detail: 'keine ADMIN_EMAILS gesetzt' },
    domains.length > 0
      ? { status: 'ok', label: 'Registrierung', detail: `offen für ${domains.map((d) => d.domain).join(', ')}` }
      : env.ADMIN_EMAILS.length > 0
        ? { status: 'warn', label: 'Registrierung', detail: 'nur Admins können sich registrieren (keine Domain)' }
        : { status: 'error', label: 'Registrierung', detail: 'niemand kann sich registrieren (ADMIN_EMAILS fehlt)' },
  ]
}

export async function runStartupChecks(localUserEmail?: string, tls?: TlsSetup): Promise<Check[]> {
  const checks = await commonChecks(tls)
  if (env.AUTH_MODE === 'multi') return [...checks, ...(await multiChecks())]
  return [...checks, { status: 'ok', label: 'Benutzer', detail: `lokal (${localUserEmail ?? 'local'})` }]
}
