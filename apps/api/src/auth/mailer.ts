import nodemailer, { type Transporter } from 'nodemailer'
import { env } from '../env'

export interface Mail {
  to: string
  subject: string
  text: string
  html: string
  /** Eingebettete Bilder (z. B. Logo per `cid:`). */
  attachments?: { filename: string; path: string; cid: string }[]
}

let transporter: Transporter | undefined

function getTransporter() {
  if (!env.SMTP_HOST) return undefined
  transporter ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  })
  return transporter
}

/** Versendet eine E-Mail per SMTP. Ohne SMTP_HOST (Entwicklung) landet sie im Log. */
export async function sendMail(mail: Mail) {
  const smtp = getTransporter()
  if (!smtp) {
    console.log(`[E-Mail ohne SMTP] An: ${mail.to}\nBetreff: ${mail.subject}\n\n${mail.text}\n`)
    return
  }
  try {
    const info = await smtp.sendMail({ from: env.SMTP_FROM ?? env.SMTP_USER, ...mail })
    console.log(`E-Mail an ${mail.to} gesendet („${mail.subject}“) – ${info.response}`)
  } catch (error) {
    console.error(`E-Mail an ${mail.to} fehlgeschlagen („${mail.subject}“):`, error)
    throw error
  }
}

export type MailerStatus =
  | { status: 'missing' }
  | { status: 'ok'; target: string }
  | { status: 'failed'; target: string; error: string }

/** Prüft beim Start, ob der SMTP-Server erreichbar ist und die Zugangsdaten stimmen (max. 5 s). */
export async function verifyMailer(): Promise<MailerStatus> {
  const smtp = getTransporter()
  if (!smtp) return { status: 'missing' }
  const target = `${env.SMTP_HOST}:${env.SMTP_PORT ?? 587}`
  try {
    await Promise.race([
      smtp.verify(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Zeitüberschreitung')), 5000)),
    ])
    return { status: 'ok', target }
  } catch (error) {
    return { status: 'failed', target, error: describeSmtpError(error) }
  }
}

const SMTP_ERRORS: [RegExp, string][] = [
  [/EAUTH|Invalid login|535/i, 'Zugangsdaten falsch'],
  [/ECONNREFUSED/, 'Verbindung abgelehnt'],
  [/ETIMEDOUT|Zeitüberschreitung|timeout/i, 'Zeitüberschreitung'],
  [/ENOTFOUND|EAI_AGAIN|EDNS/, 'Host nicht gefunden'],
  [/certificate|SSL|TLS/i, 'TLS-Fehler (Port/Verschlüsselung prüfen)'],
]

/** Kurze, verständliche Ursache statt der langen nodemailer-Meldung. */
function describeSmtpError(error: unknown) {
  const { code = '', message = String(error) } = (error ?? {}) as { code?: string; message?: string }
  const raw = `${code} ${message}`
  return SMTP_ERRORS.find(([pattern]) => pattern.test(raw))?.[1] ?? message
}
