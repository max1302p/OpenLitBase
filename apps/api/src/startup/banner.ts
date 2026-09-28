import { color, padEnd, visibleLength } from './ansi'
import type { Check, CheckStatus } from './checks'
import { LOGO_PARTS } from './logo'

export interface BannerInfo {
  version: string
  mode: 'single' | 'multi'
  baseUrl: string
  port: number
}

const ICONS: Record<CheckStatus, string> = {
  ok: color.green('✔'),
  warn: color.yellow('▲'),
  error: color.red('✖'),
  info: color.cyan('○'),
}

const MODE_TEXT = {
  single: 'single · lokal, ohne Login',
  multi: 'multi · gehostet, mit Login',
}

const LOGO_WIDTH = LOGO_PARTS.open[0]!.length + LOGO_PARTS.lit[0]!.length + LOGO_PARTS.base[0]!.length
const MAX_WIDTH = 76

function logoLines() {
  return LOGO_PARTS.open.map(
    (open, i) => color.brand(open) + color.grey(LOGO_PARTS.lit[i]!) + color.brand(LOGO_PARTS.base[i]!),
  )
}

function truncate(text: string, max: number) {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`
}

/** Kasten mit abgerundeten Ecken; Abschnitte durch Trennlinien getrennt. */
function box(sections: string[][]) {
  const width = Math.min(MAX_WIDTH, Math.max(LOGO_WIDTH - 2, ...sections.flat().map(visibleLength))) + 2
  const line = (l: string, m: string, r: string) => color.dim(l + m.repeat(width) + r)
  const row = (text: string) => `${color.dim('│')} ${padEnd(text, width - 2)} ${color.dim('│')}`
  return [
    line('╭', '─', '╮'),
    ...sections.flatMap((section, i) => [...(i > 0 ? [line('├', '─', '┤')] : []), ...section.map(row)]),
    line('╰', '─', '╯'),
  ]
}

function indent(lines: string[]) {
  return lines.map((l) => `  ${l}`)
}

function keyValue(key: string, value: string) {
  return `${color.dim(key.padEnd(9))} ${value}`
}

function footer(checks: Check[]) {
  const errors = checks.filter((c) => c.status === 'error').length
  const warnings = checks.filter((c) => c.status === 'warn').length
  if (errors + warnings === 0) return color.green('● Bereit.')
  const parts = [
    errors > 0 && `${errors} ${errors === 1 ? 'Problem' : 'Probleme'}`,
    warnings > 0 && `${warnings} ${warnings === 1 ? 'Hinweis' : 'Hinweise'}`,
  ].filter(Boolean)
  return (errors > 0 ? color.red : color.yellow)(`● Bereit, aber ${parts.join(' und ')} – siehe oben.`)
}

/** Ursache einer Fehlerkette (z. B. ECONNREFUSED statt der fehlgeschlagenen SQL-Abfrage). */
function rootMessage(error: unknown): string {
  let current = error
  while (current instanceof Error && current.cause) current = current.cause
  if (current instanceof AggregateError && current.errors[0]) return rootMessage(current.errors[0])
  const message = current instanceof Error ? current.message || current.name : String(current)
  return message.split('\n')[0] ?? message
}

/** Start-Banner: Logo, Eckdaten und Ergebnis der Start-Checks. */
export function renderBanner(info: BannerInfo, checks: Check[]) {
  const summary = [
    keyValue('Version', color.bold(info.version)),
    keyValue('Modus', color.bold(MODE_TEXT[info.mode])),
    keyValue('URL', info.baseUrl),
    keyValue('Port', String(info.port)),
    keyValue('Node', process.version),
  ]
  const labelWidth = Math.max(...checks.map((c) => c.label.length))
  const detailWidth = MAX_WIDTH - labelWidth - 5
  const checkRows = checks.map(
    (c) => `${ICONS[c.status]}  ${c.label.padEnd(labelWidth)}  ${color.dim(truncate(c.detail, detailWidth))}`,
  )
  return ['', ...indent(logoLines()), '', ...indent(box([summary, checkRows, [footer(checks)]])), ''].join('\n')
}

/** Abbruch vor dem Start, z. B. wenn die Datenbank nicht erreichbar ist. */
export function renderFatal(title: string, error: unknown) {
  const message = truncate(rootMessage(error), MAX_WIDTH)
  return ['', ...indent(box([[`${ICONS.error}  ${color.bold(title)}`], [color.dim(message)]])), ''].join('\n')
}

/**
 * Nach dem Erzeugen einer neuen lokalen CA: einmal vertrauen, damit Word das Add-in lädt und der
 * Browser nicht warnt. Heruntergeladen wird über http – vorher ist https ja noch nicht vertraut.
 */
export function renderTrustHint(baseUrl: string) {
  const caUrl = `${baseUrl.replace(/^https:/, 'http:').replace(/\/$/, '')}/openlitbase-ca.crt`
  return [
    `  ${ICONS.info}  ${color.bold('Neue lokale CA für HTTPS erzeugt – einmal auf diesem Rechner vertrauen:')}`,
    '',
    `     ${color.dim('macOS:')}`,
    `     curl -o /tmp/openlitbase-ca.crt ${caUrl}`,
    '     sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain /tmp/openlitbase-ca.crt',
    '',
    `     ${color.dim('Windows (PowerShell):')}`,
    `     curl.exe -o $env:TEMP\\openlitbase-ca.crt ${caUrl}`,
    '     certutil -user -addstore Root $env:TEMP\\openlitbase-ca.crt',
    '',
    `     ${color.dim('Danach Browser und Word neu starten. Details: README, Abschnitt „HTTPS lokal“.')}`,
    '',
  ].join('\n')
}
