import type { ProjectRole } from '@litbase/shared'
import { and, eq, inArray, or } from 'drizzle-orm'
import { db } from '../db/client'
import { items, projectItems, projectMembers, projects } from '../db/schema'

/**
 * Die eine Stelle, die geteilte Projekte kennt. Zugriff hat, wem das Projekt gehört oder wer als
 * Mitglied eingetragen ist; Schreibrecht haben Besitzer:in und Mitglieder mit Rolle `editor`.
 * Titel erben den Zugriff der Projekte, in denen sie liegen (eigene Titel sind immer zugänglich).
 */
export type ProjectAccess = typeof projects.$inferSelect & { role: ProjectRole }

export const canEdit = (role: ProjectRole) => role !== 'viewer'

/** Subquery: IDs aller Projekte mit Zugriff (mit `edit` nur solche mit Schreibrecht). */
export function accessibleProjectIds(userId: string, { edit = false } = {}) {
  const shared = db
    .select({ id: projectMembers.projectId })
    .from(projectMembers)
    .where(and(eq(projectMembers.userId, userId), edit ? eq(projectMembers.role, 'editor') : undefined))
  return db
    .select({ id: projects.id })
    .from(projects)
    .where(or(eq(projects.userId, userId), inArray(projects.id, shared)))
}

/** Projekt mit eigener Rolle – oder undefined ohne Zugriff. */
export async function findProject(userId: string, id: string): Promise<ProjectAccess | undefined> {
  const [row] = await db
    .select({ project: projects, memberRole: projectMembers.role })
    .from(projects)
    .leftJoin(projectMembers, and(eq(projectMembers.projectId, projects.id), eq(projectMembers.userId, userId)))
    .where(eq(projects.id, id))
  if (!row) return undefined
  if (row.project.userId === userId) return { ...row.project, role: 'owner' }
  return row.memberRole ? { ...row.project, role: row.memberRole } : undefined
}

function itemsInProjects(projectIds: ReturnType<typeof accessibleProjectIds>) {
  return db.select({ id: projectItems.itemId }).from(projectItems).where(inArray(projectItems.projectId, projectIds))
}

/** Bedingung: Titel, die der User sehen darf. */
export function readableItems(userId: string) {
  return or(eq(items.userId, userId), inArray(items.id, itemsInProjects(accessibleProjectIds(userId))))!
}

/** Bedingung: Titel, die der User bearbeiten darf. */
export function writableItems(userId: string) {
  return or(eq(items.userId, userId), inArray(items.id, itemsInProjects(accessibleProjectIds(userId, { edit: true }))))!
}
