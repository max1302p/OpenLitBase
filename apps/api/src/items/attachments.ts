import { randomUUID } from 'node:crypto'
import { and, eq, inArray } from 'drizzle-orm'
import { readableItems, writableItems } from '../projects/access'
import { db } from '../db/client'
import { attachments, items } from '../db/schema'
import { storage } from '../storage'

export const MAX_ATTACHMENT_BYTES = 50 * 1024 * 1024

export const isPdf = (bytes: Uint8Array) => new TextDecoder().decode(bytes.slice(0, 5)) === '%PDF-'

/** Speichert ein PDF als attachments/<uuid>.pdf (S3 oder UPLOAD_DIR). */
export async function saveAttachment(itemId: string, file: File) {
  return saveAttachmentBytes(itemId, file.name, new Uint8Array(await file.arrayBuffer()))
}

export async function saveAttachmentBytes(itemId: string, filename: string, bytes: Uint8Array) {
  if (!isPdf(bytes)) throw new Error('Nur PDF-Dateien sind erlaubt.')
  const relative = `attachments/${randomUUID()}.pdf`
  await storage.put(relative, bytes, 'application/pdf')
  const [row] = await db
    .insert(attachments)
    .values({ itemId, filename: filename || 'dokument.pdf', path: relative, mime: 'application/pdf' })
    .returning()
  return row!
}

/** Anhang laden, wenn der User den Titel sehen (bzw. mit `edit` bearbeiten) darf. */
export async function findAttachment(userId: string, id: string, { edit = false } = {}) {
  const [row] = await db
    .select({ attachment: attachments })
    .from(attachments)
    .innerJoin(items, eq(items.id, attachments.itemId))
    .where(and(eq(attachments.id, id), edit ? writableItems(userId) : readableItems(userId)))
  return row?.attachment
}

/** Inhalt als Web-Stream, `null` wenn die Datei fehlt. */
export function openAttachment(relative: string) {
  return storage.get(relative)
}

export async function deleteAttachmentFiles(relativePaths: string[]) {
  await storage.delete(relativePaths)
}

export async function deleteAttachment(id: string, relative: string) {
  await db.delete(attachments).where(eq(attachments.id, id))
  await deleteAttachmentFiles([relative])
}

export async function attachmentPathsForItems(itemIds: string[]) {
  if (itemIds.length === 0) return []
  const rows = await db
    .select({ path: attachments.path })
    .from(attachments)
    .where(inArray(attachments.itemId, itemIds))
  return rows.map((r) => r.path)
}

/** Dateinamen der Anhänge eines Titels (erneuter Import legt dieselbe Datei nicht doppelt an). */
export async function attachmentFilenames(itemId: string) {
  const rows = await db.select({ filename: attachments.filename }).from(attachments).where(eq(attachments.itemId, itemId))
  return new Set(rows.map((r) => r.filename))
}
