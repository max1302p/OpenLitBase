import { z } from 'zod'

export const meSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  isAdmin: z.boolean(),
  /** Institution zur E-Mail-Domain (nur Modus "multi"), für das Logo am Avatar. */
  institution: z.object({ name: z.string(), logoUrl: z.string().nullable() }).nullable(),
})
export type Me = z.infer<typeof meSchema>
