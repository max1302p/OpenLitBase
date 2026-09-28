import type { Project, ProjectResearch } from '@litbase/shared'
import { asc, eq, inArray, or } from 'drizzle-orm'
import { db } from '../db/client'
import { projectMembers, projects, user } from '../db/schema'
import type { ProjectAccess } from './access'

/** API-Darstellung inkl. Personen mit Zugriff (Besitzer:in zuerst, nur registrierte). */
export async function toProjects(rows: ProjectAccess[]): Promise<Project[]> {
  if (rows.length === 0) return []
  const ids = rows.map((r) => r.id)
  const [owners, members] = await Promise.all([
    db.select({ id: user.id, name: user.name }).from(user).where(inArray(user.id, [...new Set(rows.map((r) => r.userId))])),
    db
      .select({ projectId: projectMembers.projectId, userId: user.id, name: user.name, role: projectMembers.role })
      .from(projectMembers)
      .innerJoin(user, eq(user.id, projectMembers.userId))
      .where(inArray(projectMembers.projectId, ids))
      .orderBy(asc(user.name)),
  ])
  const ownerName = new Map(owners.map((o) => [o.id, o.name]))
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    citationStyle: row.citationStyle,
    createdAt: row.createdAt.toISOString(),
    role: row.role,
    research: row.research as ProjectResearch,
    people: [
      { userId: row.userId, name: ownerName.get(row.userId) ?? '', role: 'owner' as const },
      ...members.filter((m) => m.projectId === row.id).map(({ userId, name, role }) => ({ userId, name, role })),
    ],
  }))
}

export async function toProject(row: ProjectAccess) {
  return (await toProjects([row]))[0]!
}

/** Eigene und geteilte Projekte, alphabetisch. */
export async function listProjects(userId: string) {
  const rows = await db
    .select({ project: projects, memberRole: projectMembers.role, memberUserId: projectMembers.userId })
    .from(projects)
    .leftJoin(projectMembers, eq(projectMembers.projectId, projects.id))
    .where(or(eq(projects.userId, userId), eq(projectMembers.userId, userId)))
    .orderBy(asc(projects.name))
  const byId = new Map<string, ProjectAccess>()
  for (const { project, memberRole, memberUserId } of rows) {
    if (project.userId === userId) byId.set(project.id, { ...project, role: 'owner' })
    else if (memberUserId === userId && memberRole) byId.set(project.id, { ...project, role: memberRole })
  }
  return toProjects([...byId.values()])
}
