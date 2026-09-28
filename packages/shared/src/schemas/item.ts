import { z } from 'zod'
import { cslItemSchema } from './csl'

export const attachmentSchema = z.object({
  id: z.uuid(),
  filename: z.string(),
  mime: z.string(),
  createdAt: z.iso.datetime(),
})
export type Attachment = z.infer<typeof attachmentSchema>

export const itemSchema = z.object({
  id: z.uuid(),
  csl: cslItemSchema,
  doi: z.string().nullable(),
  isbn: z.string().nullable(),
  url: z.string().nullable(),
  tags: z.array(z.string()),
  notes: z.string().nullable(),
  createdAt: z.iso.datetime(),
  projectIds: z.array(z.uuid()),
  attachments: z.array(attachmentSchema),
})
export type Item = z.infer<typeof itemSchema>

const tagsSchema = z.array(z.string().trim().min(1).max(100)).max(100)

export const createItemSchema = z.object({
  csl: cslItemSchema,
  tags: tagsSchema.optional(),
  notes: z.string().max(100_000).nullable().optional(),
  /** Titel gehören immer zu (mindestens) einem Projekt. */
  projectId: z.uuid(),
})
export type CreateItem = z.infer<typeof createItemSchema>

export const updateItemSchema = createItemSchema.omit({ projectId: true }).partial()
export type UpdateItem = z.infer<typeof updateItemSchema>

/** DOI, ISBN, arXiv-ID, PMID oder URL – wird serverseitig aufgelöst. */
export const addByIdentifierSchema = z.object({
  input: z.string().trim().min(1).max(2000),
  projectId: z.uuid(),
})
export type AddByIdentifier = z.infer<typeof addByIdentifierSchema>

export const addByIdentifierResultSchema = z.object({
  item: itemSchema,
  /** false, wenn der Titel (gleiche DOI/ISBN) schon in der Bibliothek war. */
  created: z.boolean(),
})
export type AddByIdentifierResult = z.infer<typeof addByIdentifierResultSchema>

export const itemListQuerySchema = z.object({ projectId: z.uuid().optional() })
