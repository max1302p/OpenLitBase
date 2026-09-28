import { randomUUID } from 'node:crypto'
import type { UpdateStatus } from '@litbase/shared'
import { eq } from 'drizzle-orm'
import { db } from './db/client'
import { instance } from './db/schema'
import { env } from './env'
import { readVersion } from './version'

/**
 * Update-Prüfung: beim Start und täglich `UPDATE_CHECK_URL` abfragen. Gesendet werden nur Version,
 * Modus (single/multi) und eine zufällige Instanz-ID – damit zählt der Betreiber von
 * get.openlitbase.de anonym aktive Instanzen. `UPDATE_CHECK=off` schaltet das ab.
 */
const DAY = 24 * 60 * 60 * 1000
const current = readVersion()
let status: UpdateStatus = { enabled: env.UPDATE_CHECK === 'on', current, latest: null, updateAvailable: false, url: null, checkedAt: null }

export const getUpdateStatus = () => status

/** Zufällige, dauerhafte ID dieser Installation (keine Personendaten). */
async function instanceId() {
  const [row] = await db.select().from(instance).where(eq(instance.key, 'id'))
  if (row) return row.value
  const id = randomUUID()
  await db.insert(instance).values({ key: 'id', value: id }).onConflictDoNothing()
  const [saved] = await db.select().from(instance).where(eq(instance.key, 'id'))
  return saved?.value ?? id
}

/** 0.10.0 > 0.9.2 – nur Zahlen vergleichen, Zusätze (-beta) ignorieren. */
export function isNewer(latest: string, installed: string) {
  const parse = (v: string) => v.replace(/^v/, '').split(/[.-]/).slice(0, 3).map((n) => Number.parseInt(n, 10) || 0)
  const [a, b] = [parse(latest), parse(installed)]
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return (a[i] ?? 0) > (b[i] ?? 0)
  return false
}

export async function checkForUpdate() {
  const url = new URL(env.UPDATE_CHECK_URL)
  url.searchParams.set('v', current)
  url.searchParams.set('m', env.AUTH_MODE)
  url.searchParams.set('i', await instanceId())
  const res = await fetch(url, { headers: { 'User-Agent': `OpenLitBase/${current}` }, signal: AbortSignal.timeout(10_000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = (await res.json()) as { version?: string; url?: string }
  const latest = typeof data.version === 'string' ? data.version : null
  status = {
    ...status,
    latest,
    updateAvailable: Boolean(latest && current !== '?' && isNewer(latest, current)),
    url: typeof data.url === 'string' ? data.url : null,
    checkedAt: new Date().toISOString(),
  }
  if (status.updateAvailable) console.log(`▲ Neue Version ${latest} verfügbar (installiert: ${current})${status.url ? ` – ${status.url}` : ''}`)
  return status
}

export function scheduleUpdateCheck() {
  if (env.UPDATE_CHECK !== 'on') return
  const run = () => checkForUpdate().catch(() => undefined)
  setTimeout(() => void run(), 30_000).unref()
  setInterval(() => void run(), DAY).unref()
}
