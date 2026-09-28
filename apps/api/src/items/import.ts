import type { ImportResult } from '@litbase/shared'
import type { ImportEntry } from '../exports/formats'
import type { ZipImport } from '../exports/zip-import'
import { attachmentFilenames, isPdf, MAX_ATTACHMENT_BYTES, saveAttachmentBytes } from './attachments'
import { addItemsToProject, createItem, findDuplicate, fillMissing } from './repository'

/**
 * Titel anlegen bzw. Duplikate ergänzen und dem Projekt zuordnen. Mit `findFile` (ZIP-Import)
 * werden die im Export verknüpften PDFs angehängt – bei Duplikaten nur, wenn sie noch fehlen.
 */
export async function importEntries(
  userId: string,
  projectId: string,
  entries: ImportEntry[],
  findFile?: ZipImport['findFile'],
): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, skipped: 0, updated: 0, attachments: 0 }
  const duplicates: string[] = []

  for (const { csl, tags, attachmentPaths } of entries) {
    let itemId = await findDuplicate(userId, csl, projectId)
    if (itemId) {
      duplicates.push(itemId)
      result.skipped++
      if (await fillMissing(userId, itemId, csl, tags)) result.updated++
    } else {
      itemId = await createItem(userId, { csl, tags, projectId })
      result.imported++
    }
    if (findFile && attachmentPaths.length > 0) result.attachments += await attachFiles(itemId, attachmentPaths, findFile)
  }
  // Bereits vorhandene Titel trotzdem dem Zielprojekt zuordnen.
  if (duplicates.length > 0) await addItemsToProject(userId, projectId, duplicates)
  return result
}

async function attachFiles(itemId: string, paths: string[], findFile: ZipImport['findFile']) {
  const existing = await attachmentFilenames(itemId)
  let saved = 0
  for (const path of paths) {
    const file = findFile(path)
    if (!file || existing.has(file.name) || file.bytes.length > MAX_ATTACHMENT_BYTES || !isPdf(file.bytes)) continue
    await saveAttachmentBytes(itemId, file.name, file.bytes)
    existing.add(file.name)
    saved++
  }
  return saved
}
