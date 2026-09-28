import { eq, inArray, sql } from 'drizzle-orm'
import { db } from '../db/client'
import { attachments, items, projectItems, projectMembers, projects, user } from '../db/schema'

/**
 * Konto endgültig löschen (Art. 17 DSGVO), in einer Transaktion:
 * - eigene Projekte samt Begriffsmatrix, Mitgliedschaften und Titeln, die nur dort lagen;
 * - eigene Titel, die (auch) in geteilten Projekten anderer liegen, gehen an die Besitzer:in
 *   dieses Projekts über – dort bleiben sie, wie sie eingebracht wurden;
 * - Einladungen an die eigene Adresse; Konto, Sessions, Tokens und Einstellungen per Kaskade.
 * Liefert die Pfade der zu löschenden Dateien (erst nach dem Commit entfernen).
 */
export async function deleteAccount(userId: string, email: string) {
  return db.transaction(async (tx) => {
    const own = await tx.select({ id: projects.id }).from(projects).where(eq(projects.userId, userId))
    const ownIds = own.map((p) => p.id)
    const linkedInOwn = ownIds.length
      ? await tx.select({ itemId: projectItems.itemId }).from(projectItems).where(inArray(projectItems.projectId, ownIds))
      : []
    if (ownIds.length) await tx.delete(projects).where(inArray(projects.id, ownIds))

    // Eigene Titel, die noch in fremden Projekten liegen: an die Besitzer:in des ältesten davon übergeben
    await tx.execute(sql`
      UPDATE items SET user_id = sub.owner
      FROM (
        SELECT DISTINCT ON (pi.item_id) pi.item_id, p.user_id AS owner
        FROM project_items pi JOIN projects p ON p.id = pi.project_id
        ORDER BY pi.item_id, p.created_at
      ) sub
      WHERE items.id = sub.item_id AND items.user_id = ${userId}`)

    // Was jetzt in keinem Projekt mehr liegt, wird gelöscht (auch Titel anderer aus eigenen Projekten)
    const mine = await tx.select({ id: items.id }).from(items).where(eq(items.userId, userId))
    const candidates = [...new Set([...linkedInOwn.map((l) => l.itemId), ...mine.map((m) => m.id)])]
    let files: string[] = []
    if (candidates.length) {
      const stillLinked = new Set(
        (await tx.select({ itemId: projectItems.itemId }).from(projectItems).where(inArray(projectItems.itemId, candidates))).map((l) => l.itemId),
      )
      const orphans = candidates.filter((id) => !stillLinked.has(id))
      if (orphans.length) {
        files = (await tx.select({ path: attachments.path }).from(attachments).where(inArray(attachments.itemId, orphans))).map((f) => f.path)
        await tx.delete(items).where(inArray(items.id, orphans))
      }
    }

    await tx.delete(projectMembers).where(eq(projectMembers.email, email.toLowerCase()))
    await tx.delete(user).where(eq(user.id, userId))
    return files
  })
}
