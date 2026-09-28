import type { CreateItem, Item, UpdateItem } from '@litbase/shared'
import { and, desc, eq, inArray, or, sql, type SQL } from 'drizzle-orm'
import { db } from '../db/client'
import { attachments, items, projectItems, projects } from '../db/schema'
import { accessibleProjectIds, canEdit, findProject, readableItems, writableItems } from '../projects/access'
import { deriveColumns, stripCslId } from './identifiers'

type ItemRow = typeof items.$inferSelect

/** Lädt Projekt-Zuordnungen und Anhänge dazu und baut die API-Darstellung. */
async function toDtos(rows: ItemRow[]): Promise<Item[]> {
  if (rows.length === 0) return []
  const ids = rows.map((r) => r.id)
  const [links, files] = await Promise.all([
    db.select().from(projectItems).where(inArray(projectItems.itemId, ids)),
    db.select().from(attachments).where(inArray(attachments.itemId, ids)),
  ])
  return rows.map((row) => ({
    id: row.id,
    csl: row.csl as Item['csl'],
    doi: row.doi,
    isbn: row.isbn,
    url: row.url,
    tags: row.tags,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    projectIds: links.filter((l) => l.itemId === row.id).map((l) => l.projectId),
    attachments: files
      .filter((f) => f.itemId === row.id)
      .map((f) => ({ id: f.id, filename: f.filename, mime: f.mime, createdAt: f.createdAt.toISOString() })),
  }))
}

/** Titel eines Projekts (nur mit Zugriff aufs Projekt) bzw. ohne Projekt alle zugänglichen. */
export async function listItems(userId: string, projectId?: string): Promise<Item[]> {
  const condition = projectId
    ? inArray(
        items.id,
        db
          .select({ id: projectItems.itemId })
          .from(projectItems)
          .where(and(eq(projectItems.projectId, projectId), inArray(projectItems.projectId, accessibleProjectIds(userId)))),
      )
    : readableItems(userId)
  const rows = await db.select().from(items).where(condition).orderBy(desc(items.createdAt))
  return toDtos(rows)
}

export async function getItem(userId: string, id: string): Promise<Item | undefined> {
  const rows = await db.select().from(items).where(and(eq(items.id, id), readableItems(userId)))
  return (await toDtos(rows))[0]
}

/** Darf der User den Titel bearbeiten (eigener oder in einem Projekt mit Schreibrecht)? */
export async function canEditItem(userId: string, id: string) {
  const rows = await db.select({ id: items.id }).from(items).where(and(eq(items.id, id), writableItems(userId)))
  return rows.length > 0
}

/** Mehrere Titel des Users per ID (fremde oder gelöschte IDs fehlen einfach). */
export async function getItemsByIds(userId: string, ids: string[]): Promise<Item[]> {
  if (ids.length === 0) return []
  const rows = await db.select().from(items).where(and(readableItems(userId), inArray(items.id, ids)))
  return toDtos(rows)
}

function scopeForDuplicates(userId: string, projectId?: string) {
  if (!projectId) return eq(items.userId, userId)
  const inProject = db.select({ id: projectItems.itemId }).from(projectItems).where(eq(projectItems.projectId, projectId))
  return or(eq(items.userId, userId), inArray(items.id, inProject))!
}

function normalizeTitle(title: unknown) {
  return typeof title === 'string' ? title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '') : ''
}

function yearOf(csl: CreateItem['csl']) {
  return csl.issued?.['date-parts']?.[0]?.[0]
}

/**
 * Schon in der Bibliothek (eigene Titel und, falls angegeben, Titel des Zielprojekts – bei geteilten
 * Projekten auch die der anderen)? Gleiche DOI – oder gleicher Titel plus gleiche ISBN bzw. gleiches
 * Jahr. (Nur die ISBN reicht nicht: Kapitel teilen sie mit ihrem Sammelband.)
 */
export async function findDuplicate(userId: string, csl: CreateItem['csl'], projectId?: string) {
  const { doi, isbn } = deriveColumns(csl)
  const title = normalizeTitle(csl.title)
  const candidates = [
    doi && eq(items.doi, doi),
    isbn && eq(items.isbn, isbn),
    // Titelvergleich ohne Satz-/Leerzeichen („KI:Text. Diskurse“ = „KI:Text Diskurse“).
    title && sql`regexp_replace(lower(${items.csl}->>'title'), '[^[:alnum:]]', '', 'g') = ${title}`,
  ].filter(Boolean) as SQL[]
  if (candidates.length === 0) return undefined

  const rows = await db
    .select({ id: items.id, doi: items.doi, isbn: items.isbn, csl: items.csl })
    .from(items)
    .where(and(scopeForDuplicates(userId, projectId), or(...candidates)))
  const match = rows.find((row) => {
    if (doi && row.doi === doi) return true
    if (!title || normalizeTitle(row.csl.title) !== title) return false
    if (isbn && row.isbn === isbn) return true
    return yearOf(row.csl as CreateItem['csl']) === yearOf(csl)
  })
  return match?.id
}

const isEmpty = (value: unknown) =>
  value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)

/**
 * Duplikat beim Import um fehlende Angaben ergänzen (DOI, Abstract, Seiten …) und neue Tags
 * übernehmen; Vorhandenes bleibt unverändert. Gibt `true` zurück, wenn sich etwas geändert hat.
 */
export async function fillMissing(userId: string, id: string, csl: CreateItem['csl'], tags: string[] = []) {
  const [row] = await db.select().from(items).where(and(eq(items.id, id), writableItems(userId)))
  if (!row) return false
  const current = row.csl as CreateItem['csl']
  const additions = Object.fromEntries(
    Object.entries(stripCslId(csl)).filter(([key, value]) => !isEmpty(value) && isEmpty(current[key])),
  )
  const newTags = tags.filter((tag) => !row.tags.includes(tag))
  if (Object.keys(additions).length === 0 && newTags.length === 0) return false
  return updateItem(userId, id, { csl: { ...current, ...additions }, tags: [...row.tags, ...newTags] })
}

export async function createItem(userId: string, input: CreateItem): Promise<string> {
  const csl = stripCslId(input.csl)
  const [row] = await db
    .insert(items)
    .values({ userId, csl, ...deriveColumns(csl), tags: input.tags ?? [], notes: input.notes ?? null })
    .returning({ id: items.id })
  if (input.projectId) await addItemsToProject(userId, input.projectId, [row!.id])
  return row!.id
}

export async function updateItem(userId: string, id: string, input: UpdateItem) {
  const csl = input.csl ? stripCslId(input.csl) : undefined
  const result = await db
    .update(items)
    .set({
      ...(csl && { csl, ...deriveColumns(csl) }),
      ...(input.tags && { tags: input.tags }),
      ...(input.notes !== undefined && { notes: input.notes }),
    })
    .where(and(eq(items.id, id), writableItems(userId)))
    .returning({ id: items.id })
  return result.length > 0
}

/** Ganz löschen darf nur, wem der Titel gehört (er kann in weiteren Projekten liegen). */
export async function deleteItem(userId: string, id: string) {
  const result = await db
    .delete(items)
    .where(and(eq(items.id, id), eq(items.userId, userId)))
    .returning({ id: items.id })
  return result.length > 0
}

/** Verknüpft Titel, die der User sehen darf, mit einem Projekt, in dem er schreiben darf. */
export async function addItemsToProject(userId: string, projectId: string, itemIds: string[]) {
  const project = await findProject(userId, projectId)
  if (!project || !canEdit(project.role)) return false
  const owned = await db
    .select({ id: items.id })
    .from(items)
    .where(and(readableItems(userId), inArray(items.id, itemIds)))
  if (owned.length > 0) {
    await db
      .insert(projectItems)
      .values(owned.map((o) => ({ projectId, itemId: o.id })))
      .onConflictDoNothing()
  }
  return true
}

async function canEditProject(userId: string, projectId: string) {
  const project = await findProject(userId, projectId)
  return Boolean(project && canEdit(project.role))
}

/**
 * Titel ohne Projekt gibt es nicht: Löscht die übergebenen Items, die in keinem Projekt mehr
 * vorkommen (inkl. Anhänge), und liefert deren Dateipfade zum Aufräumen.
 */
async function deleteOrphans(itemIds: string[]) {
  if (itemIds.length === 0) return []
  const stillLinked = await db
    .select({ itemId: projectItems.itemId })
    .from(projectItems)
    .where(inArray(projectItems.itemId, itemIds))
  const linked = new Set(stillLinked.map((l) => l.itemId))
  const orphans = itemIds.filter((id) => !linked.has(id))
  if (orphans.length === 0) return []
  const files = await db
    .select({ path: attachments.path })
    .from(attachments)
    .where(inArray(attachments.itemId, orphans))
  // Unabhängig davon, wem der Titel gehört: ohne Projekt ist er nirgends mehr sichtbar.
  await db.delete(items).where(inArray(items.id, orphans))
  return files.map((f) => f.path)
}

/** Aus dem Projekt entfernen; liegt der Titel sonst nirgends, wird er gelöscht. */
export async function removeItemFromProject(userId: string, projectId: string, itemId: string) {
  if (!(await canEditProject(userId, projectId))) return undefined
  await db
    .delete(projectItems)
    .where(and(eq(projectItems.projectId, projectId), eq(projectItems.itemId, itemId)))
  return deleteOrphans([itemId])
}

/** Projekt löschen (nur Besitzer:in) – samt allen Titeln, die nur in diesem Projekt lagen. */
export async function deleteProject(userId: string, projectId: string) {
  if ((await findProject(userId, projectId))?.role !== 'owner') return undefined
  const links = await db
    .select({ itemId: projectItems.itemId })
    .from(projectItems)
    .where(eq(projectItems.projectId, projectId))
  await db.delete(projects).where(eq(projects.id, projectId))
  return deleteOrphans(links.map((l) => l.itemId))
}
