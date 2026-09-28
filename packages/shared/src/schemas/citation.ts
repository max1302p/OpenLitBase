import { z } from 'zod'

export const citationStyleSchema = z.object({
  id: z.string(),
  title: z.string(),
  format: z.string().nullable(),
})
export type CitationStyle = z.infer<typeof citationStyleSchema>

export const settingsSchema = z.object({
  /** Standard-Zitierstil des Accounts; Projekte können ihn überschreiben. */
  citationStyle: z.string().min(1),
})
export type Settings = z.infer<typeof settingsSchema>

export const bibliographySchema = z.object({
  styleId: z.string(),
  entries: z.array(z.object({ id: z.string(), html: z.string(), text: z.string() })),
})
export type Bibliography = z.infer<typeof bibliographySchema>

export const bibliographyExportFormats = ['docx', 'markdown', 'bibtex'] as const
export type BibliographyExportFormat = (typeof bibliographyExportFormats)[number]

/** Ein Zitat im Word-Dokument: ein oder mehrere Titel, optional mit Seitenangabe. */
export const documentCitationSchema = z.object({
  id: z.string().min(1).max(100),
  items: z
    .array(z.object({ id: z.uuid(), locator: z.string().trim().max(50).optional() }))
    .min(1)
    .max(50),
})
export type DocumentCitation = z.infer<typeof documentCitationSchema>

/** Alle Zitate eines Dokuments in Dokumentreihenfolge (Word-Add-in). */
export const formatDocumentSchema = z.object({
  citations: z.array(documentCitationSchema).max(5000),
})
export type FormatDocumentInput = z.infer<typeof formatDocumentSchema>

export const formattedDocumentSchema = z.object({
  styleId: z.string(),
  /** Zitattext je Zitat-ID (z. B. „[1], S. 12“). */
  citations: z.array(z.object({ id: z.string(), text: z.string() })),
  /** Literaturverzeichnis als Office-Open-XML (für `insertOoxml`); leer ohne Zitate. */
  bibliographyOoxml: z.string(),
  bibliographyCount: z.number().int(),
})
export type FormattedDocument = z.infer<typeof formattedDocumentSchema>
