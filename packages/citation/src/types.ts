/** Ein CSL-JSON-Eintrag. `id` muss gesetzt sein. */
export interface CslItem {
  id: string
  type: string
  [key: string]: unknown
}

export type OutputFormat = 'html' | 'text'

/** Liefert das XML einer CSL-Locale (z. B. `de-DE`) oder undefined, wenn nicht vorhanden. */
export type LocaleLoader = (lang: string) => string | undefined

export interface EngineInput {
  styleXml: string
  loadLocale: LocaleLoader
  items: CslItem[]
  format?: OutputFormat
}

/** Ein Zitat im Dokument: ein oder mehrere Titel, optional mit Seitenangabe. */
export interface CitationInput {
  id: string
  items: { id: string; locator?: string; label?: string }[]
}

export interface BibliographyEntry {
  id: string
  /** Formatierter Eintrag inkl. Nummer bei numerischen Stilen. */
  text: string
}
