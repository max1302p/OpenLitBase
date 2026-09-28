import { Cite } from '@citation-js/core'
import '@citation-js/plugin-bibtex'
import '@citation-js/plugin-ris'
import type { CslItem, ExportFormat, ImportFormat } from '@litbase/shared'
import { sanitizeCsl } from '../resolvers/csl-utils'
import { bibtexFiles } from './bibtex-files'
import { parseEndnote } from './enw'
import { normalizeKnownSources } from './known-sources'
import { parseRis } from './ris'

export interface ImportEntry {
  csl: CslItem
  tags: string[]
  /** Relative Pfade aus dem Export (RIS `L1`, BibTeX `file`, EndNote `%>`), z. B. `Attachments/xy.pdf`. */
  attachmentPaths: string[]
}

/** Schlagwörter („a,b;c“ oder Array) → Tags. */
function keywordsToTags(keyword: unknown): string[] {
  const list = Array.isArray(keyword) ? keyword : typeof keyword === 'string' ? keyword.split(/[,;]/) : []
  return [...new Set(list.map((k) => String(k).trim()).filter(Boolean))]
}

/** `files`: Anhänge pro CSL-`id` (bei BibTeX der Zitierschlüssel). */
function fromCslData(data: unknown[], files = new Map<string, string[]>()): ImportEntry[] {
  return data
    .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object')
    .map((entry) => {
      const { keyword, ...csl } = entry
      const attachmentPaths = files.get(String(csl.id)) ?? []
      return { csl: sanitizeCsl(csl), tags: keywordsToTags(keyword), attachmentPaths }
    })
}

function parseEntries(format: ImportFormat, content: string): ImportEntry[] {
  switch (format) {
    case 'ris':
      return parseRis(content)
    case 'endnote':
      return parseEndnote(content)
    case 'csl-json':
      return fromCslData([JSON.parse(content)].flat())
    case 'bibtex':
      return fromCslData(new Cite(content).data as unknown[], bibtexFiles(content))
  }
}

/** BibTeX-, RIS-, EndNote- oder CSL-JSON-Text → bereinigte Einträge (ohne Titel werden verworfen). */
export function parseImport(format: ImportFormat, content: string): ImportEntry[] {
  return parseEntries(format, content)
    .filter((e) => e.csl.title)
    .map((e) => ({ ...e, csl: normalizeKnownSources(e.csl) }))
}

interface ExportItem {
  id: string
  csl: CslItem
}

/** BibTeX-Schlüssel wie „lecun2015“, bei Kollisionen mit Suffix a, b, … */
function citationKeys(items: ExportItem[]) {
  const used = new Map<string, number>()
  return items.map(({ csl }) => {
    const existing = csl['citation-key']
    if (typeof existing === 'string' && existing) return existing
    const person = csl.author?.[0] ?? csl.editor?.[0]
    const name = (person?.family ?? person?.literal ?? csl.title ?? 'titel')
      .normalize('NFD')
      .replace(/[^a-zA-Z]/g, '')
      .toLowerCase()
      .slice(0, 20)
    const year = csl.issued?.['date-parts']?.[0]?.[0] ?? ''
    const base = `${name}${year}`
    const count = used.get(base) ?? 0
    used.set(base, count + 1)
    return count === 0 ? base : `${base}${String.fromCharCode(96 + count)}`
  })
}

export function formatExport(format: ExportFormat, items: ExportItem[]): string {
  const keys = citationKeys(items)
  const data = items.map(({ csl }, i) => ({ ...csl, id: keys[i], 'citation-key': keys[i] }))
  if (format === 'csl-json') return JSON.stringify(data, null, 2)
  return new Cite(data).format(format === 'bibtex' ? 'bibtex' : 'ris', { format: 'text' }) as string
}

export const exportFileInfo: Record<ExportFormat, { ext: string; mime: string }> = {
  bibtex: { ext: 'bib', mime: 'application/x-bibtex; charset=utf-8' },
  ris: { ext: 'ris', mime: 'application/x-research-info-systems; charset=utf-8' },
  'csl-json': { ext: 'json', mime: 'application/vnd.citationstyles.csl+json; charset=utf-8' },
}
