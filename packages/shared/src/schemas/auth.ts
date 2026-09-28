import { z } from 'zod'

/** Freigegebene Institution (öffentlich, für „Verfügbar für: …“ auf der Login-Seite). */
export const institutionSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  domain: z.string(),
  /** Relativ zur API (mit Versions-Parameter gegen Browser-Cache), null = Initialen anzeigen. */
  logoUrl: z.string().nullable(),
})
export type Institution = z.infer<typeof institutionSchema>

export const apiTokenSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  createdAt: z.iso.datetime(),
  lastUsedAt: z.iso.datetime().nullable(),
})
export type ApiToken = z.infer<typeof apiTokenSchema>

export const createApiTokenSchema = z.object({ name: z.string().trim().min(1).max(100) })
export type CreateApiToken = z.infer<typeof createApiTokenSchema>

/** Antwort beim Erzeugen: der Klartext-Token wird nur dieses eine Mal geliefert. */
export const createdApiTokenSchema = apiTokenSchema.extend({ token: z.string() })
export type CreatedApiToken = z.infer<typeof createdApiTokenSchema>
