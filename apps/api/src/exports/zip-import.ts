import type { ImportFormat } from '@litbase/shared'
import { unzipSync } from 'fflate'

const FORMATS: Record<string, ImportFormat> = { ris: 'ris', bib: 'bibtex', bibtex: 'bibtex', enw: 'endnote', json: 'csl-json' }

export interface ZipFile {
  name: string
  bytes: Uint8Array
}

export interface ZipImport {
  format: ImportFormat
  content: string
  /** Sucht eine Datei zu einem Pfad aus dem Export (`Attachments/xy.pdf`). */
  findFile: (reference: string) => ZipFile | undefined
}

const basename = (p: string) => p.split('/').pop() ?? p

/**
 * Vergleichsschlüssel für Pfade: Windows-ZIPs (Citavi) speichern Umlaute ohne UTF-8-Kennzeichen,
 * fflate liest sie dann als Latin-1 („Némorin“ ≠ „N\x82morin“). Deshalb nur a–z, 0–9, `/` und `.`.
 */
const looseKey = (p: string) =>
  p
    .replace(/\\/g, '/')
    .replace(/^\.?\//, '')
    .toLowerCase()
    .replace(/[^a-z0-9/.]/g, '')

/**
 * Export-ZIP (z. B. Citavi „Projekt exportieren“): eine Literaturdatei (RIS, BibTeX, EndNote,
 * CSL-JSON) plus Anhänge. Gibt `undefined` zurück, wenn keine Literaturdatei enthalten ist.
 */
export function readZipImport(bytes: Uint8Array): ZipImport | undefined {
  const entries = Object.entries(unzipSync(bytes))
    .filter(([name]) => !name.endsWith('/') && !name.startsWith('__MACOSX/'))
    .map(([name, data]) => ({ name, bytes: data }))

  // Die Literaturdatei liegt meist auf oberster Ebene; bei mehreren gewinnt die am wenigsten tiefe.
  const reference = entries
    .filter((e) => FORMATS[e.name.split('.').pop()!.toLowerCase()])
    .sort((a, b) => a.name.split('/').length - b.name.split('/').length)[0]
  if (!reference) return undefined

  const byPath = new Map(entries.map((e) => [looseKey(e.name), e]))
  const byName = new Map(entries.map((e) => [looseKey(basename(e.name)), e]))
  return {
    format: FORMATS[reference.name.split('.').pop()!.toLowerCase()]!,
    content: new TextDecoder().decode(reference.bytes),
    // Pfade sind relativ zur Literaturdatei; absolute (verknüpfte Dateien) über den Dateinamen.
    findFile: (ref) => {
      const dir = reference.name.includes('/') ? reference.name.slice(0, reference.name.lastIndexOf('/') + 1) : ''
      const file = byPath.get(looseKey(dir + ref)) ?? byPath.get(looseKey(ref)) ?? byName.get(looseKey(basename(ref.replace(/\\/g, '/'))))
      return file && { name: basename(ref.replace(/\\/g, '/')), bytes: file.bytes }
    },
  }
}
