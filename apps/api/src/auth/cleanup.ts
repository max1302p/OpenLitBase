import { isNotNull, lt } from 'drizzle-orm'
import { db } from '../db/client'
import { allowedDomains, attachments, session, verification } from '../db/schema'
import { storage } from '../storage'

const DAY = 24 * 60 * 60 * 1000

/** Abgelaufene Sessions (mit IP-Adresse und Browserkennung) und Bestätigungslinks löschen. */
export async function purgeExpired() {
  const now = new Date()
  await db.delete(session).where(lt(session.expiresAt, now))
  await db.delete(verification).where(lt(verification.expiresAt, now))
}

/**
 * Dateien ohne Datensatz löschen (z. B. wenn beim Löschen eines Titels der Speicher kurz nicht
 * erreichbar war). Nur Dateien älter als ein Tag – laufende Uploads bleiben unberührt.
 */
export async function purgeOrphanFiles() {
  const known = new Set<string>([
    ...(await db.select({ p: attachments.path }).from(attachments)).map((r) => r.p),
    ...(await db.select({ p: allowedDomains.logoPath }).from(allowedDomains).where(isNotNull(allowedDomains.logoPath))).map((r) => r.p!),
  ])
  const limit = Date.now() - DAY
  const files = [...(await storage.list('attachments/')), ...(await storage.list('logos/'))]
  const orphans = files.filter((f) => !known.has(f.key) && f.modified.getTime() < limit).map((f) => f.key)
  if (orphans.length) {
    await storage.delete(orphans)
    console.log(`✔ ${orphans.length} verwaiste Datei(en) gelöscht`)
  }
  return orphans.length
}

/** Beim Start und danach täglich – die Datenschutzerklärung nennt diese Speicherfristen. */
export function schedulePurge() {
  const run = () =>
    Promise.all([
      purgeExpired().catch((error) => console.warn('Bereinigung abgelaufener Sessions fehlgeschlagen:', error)),
      purgeOrphanFiles().catch((error) => console.warn('Bereinigung verwaister Dateien fehlgeschlagen:', error)),
    ])
  void run()
  setInterval(run, DAY).unref()
}
