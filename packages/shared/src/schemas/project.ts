import { z } from 'zod'

/** Forschungsdreisatz: Thema · Erkenntnisinteresse · Relevanz – plus die Forschungsfrage. */
export const projectResearchSchema = z.object({
  topic: z.string().trim().max(1000).optional(),
  knowledgeGoal: z.string().trim().max(1000).optional(),
  relevance: z.string().trim().max(1000).optional(),
  question: z.string().trim().max(1000).optional(),
})
export type ProjectResearch = z.infer<typeof projectResearchSchema>

/** Rechte in geteilten Projekten; `owner` hat das Projekt angelegt. */
export const projectRoles = ['owner', 'editor', 'viewer'] as const
export const projectRoleSchema = z.enum(projectRoles)
export type ProjectRole = z.infer<typeof projectRoleSchema>
export const memberRoleSchema = z.enum(['editor', 'viewer'])
export type MemberRole = z.infer<typeof memberRoleSchema>

/** Person mit Zugriff (für den Avatar-Fächer); nur registrierte, Besitzer:in zuerst. */
export const projectPersonSchema = z.object({
  userId: z.string(),
  name: z.string(),
  role: projectRoleSchema,
})
export type ProjectPerson = z.infer<typeof projectPersonSchema>

export const projectSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  /** null = Standard-Zitierstil der Besitzerin bzw. des Besitzers. */
  citationStyle: z.string().nullable(),
  createdAt: z.iso.datetime(),
  /** Eigenes Recht in diesem Projekt. */
  role: projectRoleSchema,
  people: z.array(projectPersonSchema),
  research: projectResearchSchema,
})
export type Project = z.infer<typeof projectSchema>

/** Geteilt = mehr als eine Person hat Zugriff. */
export const isSharedProject = (project: Pick<Project, 'people'>) => project.people.length > 1
export const canEditProject = (project: Pick<Project, 'role'>) => project.role !== 'viewer'

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(200),
  citationStyle: z.string().trim().min(1).nullable().optional(),
})
export type CreateProject = z.infer<typeof createProjectSchema>

export const updateProjectSchema = createProjectSchema.partial().extend({ research: projectResearchSchema.optional() })
export type UpdateProject = z.infer<typeof updateProjectSchema>

export const projectItemsSchema = z.object({ itemIds: z.array(z.uuid()).min(1).max(1000) })
export type ProjectItems = z.infer<typeof projectItemsSchema>

/** Eintrag in der Teilen-Liste (inkl. offener Einladungen). */
export const projectMemberSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  role: memberRoleSchema,
  /** null = noch nicht registriert (Einladung offen). */
  userId: z.string().nullable(),
  name: z.string().nullable(),
  createdAt: z.iso.datetime(),
})
export type ProjectMember = z.infer<typeof projectMemberSchema>

export const projectMembersSchema = z.object({
  owner: z.object({ userId: z.string(), name: z.string(), email: z.string() }),
  members: z.array(projectMemberSchema),
})
export type ProjectMembers = z.infer<typeof projectMembersSchema>

export const inviteMemberSchema = z.object({
  email: z.email().transform((e) => e.trim().toLowerCase()),
  role: memberRoleSchema,
})
export type InviteMember = z.input<typeof inviteMemberSchema>

export const updateMemberSchema = z.object({ role: memberRoleSchema })
export type UpdateMember = z.infer<typeof updateMemberSchema>
