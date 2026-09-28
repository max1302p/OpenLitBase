import { z } from 'zod'

/**
 * Rechercheprotokoll: pro Titel und Projekt, wie in der gängigen Vorlage
 * (Liste der recherchierten Titel).
 */
export const itemProtocolSchema = z.object({
  /** Wie der Titel im Text zitiert bzw. verwendet wird. */
  citation: z.string().trim().max(2000).optional(),
  /** Themeneinordnung, Schlüsselbegriffe. */
  keywords: z.string().trim().max(2000).optional(),
  /** Fachliche Eignung für die Entwicklung der Fragestellung. */
  suitability: z.string().trim().max(4000).optional(),
})
export type ItemProtocol = z.infer<typeof itemProtocolSchema>

/** Eine Zeile der Titelliste; die Nummer entspricht dem Literaturverzeichnis. */
export const protocolEntrySchema = z.object({
  itemId: z.uuid(),
  number: z.number().int(),
  /** Eintrag im Literaturverzeichnis (HTML), Zitierstil des Projekts. */
  reference: z.string(),
  type: z.string(),
  protocol: itemProtocolSchema,
})
export type ProtocolEntry = z.infer<typeof protocolEntrySchema>

export const protocolSchema = z.object({
  styleId: z.string(),
  entries: z.array(protocolEntrySchema),
})
export type Protocol = z.infer<typeof protocolSchema>

export const protocolExportFormats = ['docx', 'markdown'] as const
export type ProtocolExportFormat = (typeof protocolExportFormats)[number]
