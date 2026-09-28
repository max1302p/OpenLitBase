import { z } from 'zod'

/** Personen in CSL-JSON: entweder Nachname/Vorname oder ein Literal (Körperschaft). */
export const cslNameSchema = z
  .object({
    family: z.string().optional(),
    given: z.string().optional(),
    literal: z.string().optional(),
  })
  .loose()
export type CslName = z.infer<typeof cslNameSchema>

export const cslDateSchema = z
  .object({
    'date-parts': z.array(z.array(z.union([z.number(), z.string()]))).optional(),
    raw: z.string().optional(),
    literal: z.string().optional(),
  })
  .loose()
export type CslDate = z.infer<typeof cslDateSchema>

/** CSL-JSON-Eintrag. Nur die Felder, die litbase direkt nutzt, sind typisiert; der Rest bleibt erhalten. */
export const cslItemSchema = z
  .object({
    id: z.string().optional(),
    type: z.string().min(1),
    title: z.string().optional(),
    author: z.array(cslNameSchema).optional(),
    editor: z.array(cslNameSchema).optional(),
    issued: cslDateSchema.optional(),
    accessed: cslDateSchema.optional(),
    'container-title': z.string().optional(),
    publisher: z.string().optional(),
    'publisher-place': z.string().optional(),
    DOI: z.string().optional(),
    ISBN: z.string().optional(),
    URL: z.string().optional(),
  })
  .loose()
export type CslItem = z.infer<typeof cslItemSchema>
