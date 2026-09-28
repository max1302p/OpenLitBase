import { z } from 'zod'

/** „@Student.Hochschule.ch“, „https://hochschule.ch/“ → „student.hochschule.ch“ bzw. „hochschule.ch“. */
export function normalizeDomain(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^.*@/, '')
    .replace(/\/.*$/, '')
}

export const domainNameSchema = z
  .string()
  .transform(normalizeDomain)
  .pipe(z.string().regex(/^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/, 'Ungültige Domain'))

export const domainInputSchema = z.object({
  domain: domainNameSchema,
  name: z.string().trim().min(1).max(200),
  active: z.boolean().optional(),
})
export type DomainInput = z.input<typeof domainInputSchema>

export const updateDomainSchema = domainInputSchema.partial()
export type UpdateDomain = z.input<typeof updateDomainSchema>

export const adminDomainSchema = z.object({
  id: z.uuid(),
  domain: z.string(),
  name: z.string(),
  active: z.boolean(),
  logoUrl: z.string().nullable(),
  userCount: z.number().int(),
  createdAt: z.iso.datetime(),
})
export type AdminDomain = z.infer<typeof adminDomainSchema>

export const adminUserStatuses = ['active', 'unverified', 'blocked', 'admin'] as const
export type AdminUserStatus = (typeof adminUserStatuses)[number]

export const adminUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  institution: z.string().nullable(),
  emailVerified: z.boolean(),
  status: z.enum(adminUserStatuses),
  createdAt: z.iso.datetime(),
  lastSignInAt: z.iso.datetime().nullable(),
})
export type AdminUser = z.infer<typeof adminUserSchema>
