import { z } from 'zod'

export const importFormats = ['bibtex', 'ris', 'endnote', 'csl-json'] as const
export const exportFormats = ['bibtex', 'ris', 'csl-json'] as const
export type ImportFormat = (typeof importFormats)[number]
export type ExportFormat = (typeof exportFormats)[number]

export const importSchema = z.object({
  format: z.enum(importFormats),
  content: z.string().min(1).max(20_000_000),
  projectId: z.uuid(),
})
export type ImportInput = z.infer<typeof importSchema>

/** Maximale Grösse eines Export-ZIPs (Citavi-Projekt mit PDFs). */
export const MAX_IMPORT_ZIP_BYTES = 300 * 1024 * 1024

export const importResultSchema = z.object({
  imported: z.number().int(),
  skipped: z.number().int(),
  /** Bereits vorhandene Titel, die um fehlende Angaben ergänzt wurden. */
  updated: z.number().int(),
  /** Angehängte PDFs (nur beim ZIP-Import). */
  attachments: z.number().int(),
})
export type ImportResult = z.infer<typeof importResultSchema>

export const exportQuerySchema = z.object({
  format: z.enum(exportFormats),
  projectId: z.uuid().optional(),
})
