import { de, detectIdentifier, type AddByIdentifierResult } from '@litbase/shared'
import { resolveIdentifier } from '../resolvers'
import { addItemsToProject, createItem, findDuplicate, getItem } from './repository'

/**
 * DOI, ISBN, arXiv-ID, PMID oder URL auflösen und ins Projekt legen; Duplikate werden nur
 * zugeordnet. Schreibrecht aufs Projekt muss vorher geprüft sein (Web-API und MCP).
 */
export async function addByIdentifier(
  userId: string,
  projectId: string,
  input: string,
): Promise<AddByIdentifierResult | { error: string; status: 400 | 404 }> {
  const identifier = detectIdentifier(input)
  if (!identifier) return { error: de.errors.unknownIdentifier, status: 400 }

  const csl = await resolveIdentifier(identifier)
  if (!csl) return { error: de.errors.notResolved, status: 404 }

  const existingId = await findDuplicate(userId, csl, projectId)
  if (existingId) await addItemsToProject(userId, projectId, [existingId])
  const id = existingId ?? (await createItem(userId, { csl, projectId }))
  return { item: (await getItem(userId, id))!, created: !existingId }
}
