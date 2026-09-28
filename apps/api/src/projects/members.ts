import type { MemberRole, ProjectMember, ProjectMembers } from '@litbase/shared'
import { and, asc, eq, isNull } from 'drizzle-orm'
import { db } from '../db/client'
import { projectMembers, user } from '../db/schema'
import type { ProjectAccess } from './access'

type MemberRow = typeof projectMembers.$inferSelect

function toMember(row: MemberRow, name: string | null): ProjectMember {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    userId: row.userId,
    name,
    createdAt: row.createdAt.toISOString(),
  }
}

/** Besitzer:in und Mitglieder; offene Einladungen sieht nur die Besitzerin bzw. der Besitzer. */
export async function listMembers(project: ProjectAccess): Promise<ProjectMembers> {
  const [owner] = await db.select({ userId: user.id, name: user.name, email: user.email }).from(user).where(eq(user.id, project.userId))
  const rows = await db
    .select({ member: projectMembers, name: user.name })
    .from(projectMembers)
    .leftJoin(user, eq(user.id, projectMembers.userId))
    .where(eq(projectMembers.projectId, project.id))
    .orderBy(asc(projectMembers.createdAt))
  return {
    owner: owner!,
    members: rows
      .filter(({ member }) => member.userId || project.role === 'owner')
      .map(({ member, name }) => toMember(member, name)),
  }
}

export async function findUserByEmail(email: string) {
  const [found] = await db.select({ id: user.id, name: user.name, email: user.email }).from(user).where(eq(user.email, email))
  return found
}

export async function findMember(projectId: string, memberId: string) {
  const [row] = await db
    .select()
    .from(projectMembers)
    .where(and(eq(projectMembers.id, memberId), eq(projectMembers.projectId, projectId)))
  return row
}

export async function memberByEmail(projectId: string, email: string) {
  const [row] = await db
    .select()
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.email, email)))
  return row
}

export async function addMember(input: { projectId: string; email: string; role: MemberRole; userId: string | null; invitedBy: string }) {
  const [row] = await db.insert(projectMembers).values(input).returning()
  return row!
}

export async function updateMemberRole(id: string, role: MemberRole) {
  const [row] = await db.update(projectMembers).set({ role }).where(eq(projectMembers.id, id)).returning()
  return row!
}

export async function removeMember(id: string) {
  await db.delete(projectMembers).where(eq(projectMembers.id, id))
}

export { toMember }

/** Nach der Registrierung: offene Einladungen an diese Adresse dem neuen Konto zuordnen. */
export async function claimInvitations(userId: string, email: string) {
  await db
    .update(projectMembers)
    .set({ userId })
    .where(and(eq(projectMembers.email, email.toLowerCase()), isNull(projectMembers.userId)))
}
