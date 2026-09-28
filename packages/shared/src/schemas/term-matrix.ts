import { z } from 'zod'

/** Fixe Zeilen der Begriffsmatrix (gängige Bibliotheksvorlage). */
export const termMatrixRowKeys = [
  'synonyms',
  'broader',
  'narrower',
  'related',
  'opposite',
  'english',
] as const
export const termMatrixRowKeySchema = z.enum(termMatrixRowKeys)
export type TermMatrixRowKey = z.infer<typeof termMatrixRowKeySchema>

export const termSchema = z.object({
  text: z.string().trim().min(1).max(200),
  truncate: z.boolean().default(false),
})
export type Term = z.infer<typeof termSchema>

/** Eine Spalte = ein Teilthema bzw. Hauptbegriff mit Begriffen pro Zeile. */
export const termMatrixColumnSchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().max(200),
  cells: z.partialRecord(termMatrixRowKeySchema, z.array(termSchema).max(100)),
})
export type TermMatrixColumn = z.infer<typeof termMatrixColumnSchema>

export const termMatrixDataSchema = z.object({
  columns: z.array(termMatrixColumnSchema).max(20),
})
export type TermMatrixData = z.infer<typeof termMatrixDataSchema>

export const termMatrixExportFormats = ['docx', 'markdown'] as const
export type TermMatrixExportFormat = (typeof termMatrixExportFormats)[number]
