import type { ItemProtocol, Protocol } from '@litbase/shared'
import { and, eq } from 'drizzle-orm'
import { renderBibliography } from '../citation/format'
import { resolveStyleId } from '../citation/styles'
import { db } from '../db/client'
import { projectItems } from '../db/schema'
import { listItems } from '../items/repository'

/**
 * Titelliste des Rechercheprotokolls in der Reihenfolge des Literaturverzeichnisses – so stimmen
 * die Nummern mit der Bibliografie überein.
 */
export async function getProtocol(userId: string, projectId: string): Promise<Protocol & { bibliography: string[] }> {
  const items = await listItems(userId, projectId)
  const styleId = await resolveStyleId(userId, projectId)
  const { entries } = renderBibliography(styleId, items)
  const links = await db
    .select({ itemId: projectItems.itemId, protocol: projectItems.protocol })
    .from(projectItems)
    .where(eq(projectItems.projectId, projectId))
  const protocols = new Map(links.map((l) => [l.itemId, l.protocol as ItemProtocol]))
  const types = new Map(items.map((item) => [item.id, item.csl.type]))
  return {
    styleId,
    entries: entries.map((entry, i) => ({
      itemId: entry.id,
      number: i + 1,
      reference: entry.html,
      type: types.get(entry.id) ?? 'document',
      protocol: protocols.get(entry.id) ?? {},
    })),
    bibliography: entries.map((entry) => entry.html),
  }
}

/** Das Projekt muss vorher (mit Schreibrecht) geprüft sein. */
export async function saveItemProtocol(projectId: string, itemId: string, protocol: ItemProtocol) {
  const [row] = await db
    .update(projectItems)
    .set({ protocol })
    .where(and(eq(projectItems.projectId, projectId), eq(projectItems.itemId, itemId)))
    .returning({ protocol: projectItems.protocol })
  return row?.protocol as ItemProtocol | undefined
}
