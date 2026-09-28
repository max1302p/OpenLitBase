import { existsSync } from 'node:fs'
import path from 'node:path'
import { de } from '@litbase/shared'
import { env } from '../env'
import type { Mail } from './mailer'

/** Logo als eingebettetes Bild (CID): kein Nachladen von aussen, funktioniert auch lokal. */
const LOGO_FILE = path.resolve('assets/email-logo.png')
const LOGO_CID = 'logo@openlitbase'

const BRAND = '#0B2351'
const TEXT = '#1b2440'
const MUTED = '#6b7280'
const BORDER = '#e4e7ee'
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`)
}

interface EmailContent {
  subject: string
  preheader: string
  title: string
  intro: string
  button: string
  note: string
}

/**
 * Einheitliches Layout: Logo, weisse Karte mit Titel, Text und Knopf, Ersatzlink, Fusszeile.
 * Tabellen und Inline-Styles, damit es auch in Outlook und Webmailern hält.
 */
/** Rechtstexte der Betreiberin für den Footer (LEGAL_*). */
function legalLinks() {
  const links: { label: string; url: string | undefined }[] = [
    { label: de.legal.privacy, url: env.LEGAL_PRIVACY_URL },
    { label: de.legal.terms, url: env.LEGAL_TERMS_URL },
    { label: de.legal.imprint, url: env.LEGAL_IMPRINT_URL },
  ]
  return links.filter((l): l is { label: string; url: string } => Boolean(l.url))
}

export function renderEmail(content: EmailContent, name: string, url: string): Omit<Mail, 'to'> {
  const legal = legalLinks()
  const hasLogo = existsSync(LOGO_FILE)
  const home = env.BASE_URL.replace(/\/$/, '')
  const p = (text: string, style = '') => `<p style="margin:0 0 16px;${style}">${escapeHtml(text)}</p>`
  const logo = hasLogo
    ? `<img src="cid:${LOGO_CID}" width="180" height="28" alt="${de.appName}" style="display:block;margin:0 auto;border:0;outline:none;height:auto">`
    : `<span style="font:600 22px ${FONT};color:${BRAND}">${de.appName}</span>`

  const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(content.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f7">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(content.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f7">
<tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td align="center" style="padding:0 4px 28px">${logo}</td></tr>
<tr><td style="background:#ffffff;border:1px solid ${BORDER};border-radius:12px;padding:40px 36px 32px;font:15px/1.6 ${FONT};color:${TEXT}">
<h1 style="margin:0 0 20px;font:600 22px/1.3 ${FONT};color:${BRAND}">${escapeHtml(content.title)}</h1>
${p(de.emails.greeting(name))}
${p(content.intro)}
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0">
<tr><td style="border-radius:8px;background:${BRAND}">
<a href="${escapeHtml(url)}" style="display:inline-block;padding:13px 26px;font:600 15px ${FONT};color:#ffffff;text-decoration:none;border-radius:8px">${escapeHtml(content.button)}</a>
</td></tr>
</table>
${p(content.note, `font-size:13px;color:${MUTED}`)}
<div style="border-top:1px solid ${BORDER};margin:28px 0 20px"></div>
<p style="margin:0;font-size:12px;line-height:1.5;color:${MUTED}">${escapeHtml(de.emails.fallbackLink)}<br>
<a href="${escapeHtml(url)}" style="color:${BRAND};word-break:break-all">${escapeHtml(url)}</a></p>
</td></tr>
<tr><td align="center" style="padding:24px 16px 0;font:12px/1.6 ${FONT};color:#8a90a2">
${escapeHtml(de.emails.footer)}<br>
<a href="${escapeHtml(home)}" style="color:#8a90a2">${escapeHtml(home.replace(/^https?:\/\//, ''))}</a> · ${escapeHtml(de.emails.automatic)}${
    legal.length ? `<br>${legal.map((l) => `<a href="${escapeHtml(l.url)}" style="color:#8a90a2">${escapeHtml(l.label)}</a>`).join(' · ')}` : ''
  }
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`

  const text = [
    content.title,
    de.emails.greeting(name),
    content.intro,
    `${content.button}:\n${url}`,
    content.note,
    `--\n${de.appName} · ${home}\n${de.emails.automatic}${legal.map((l) => `\n${l.label}: ${l.url}`).join('')}`,
  ].join('\n\n')

  return {
    subject: `${content.subject} – ${de.appName}`,
    text,
    html,
    attachments: hasLogo ? [{ filename: 'openlitbase.png', path: LOGO_FILE, cid: LOGO_CID }] : [],
  }
}

interface InvitationInput {
  inviter: string
  projectName: string
  role: 'editor' | 'viewer'
  /** Name, wenn die Person schon ein Konto hat. */
  recipientName: string | undefined
  url: string
}

/** Einladung zu einem geteilten Projekt – für bestehende Konten und für neue Personen. */
export function invitationEmail({ inviter, projectName, role, recipientName, url }: InvitationInput) {
  const t = de.emails.invite
  const access = t.access(role)
  const registered = recipientName !== undefined
  return renderEmail(
    {
      subject: t.subject(inviter, projectName),
      preheader: t.preheader(projectName),
      title: t.title,
      intro: registered ? t.introExisting(inviter, projectName, access) : t.introNew(inviter, projectName, access),
      button: registered ? t.buttonExisting : t.buttonNew,
      note: t.note,
    },
    recipientName ?? '',
    url,
  )
}

export const verificationEmail = (name: string, url: string) => renderEmail(de.emails.verify, name, url)
export const resetPasswordEmail = (name: string, url: string) => renderEmail(de.emails.reset, name, url)
export const accountDeletedEmail = (name: string) =>
  renderEmail(de.emails.accountDeleted, name, env.BASE_URL.replace(/\/$/, ''))
export const passwordChangedEmail = (name: string) =>
  renderEmail(de.emails.passwordChanged, name, `${env.BASE_URL.replace(/\/$/, '')}/login`)
