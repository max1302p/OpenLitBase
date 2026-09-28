import { createEngine } from './engine'
import { appendLocators, hasLocatorInBibliography, splitByLocator } from './locator-in-bibliography'
import type { BibliographyEntry, CitationInput, EngineInput } from './types'

function cleanup(entry: string) {
  return entry.replace(/\s+/g, ' ').trim()
}

/** Bibliografie-Einträge aus der citeproc-Ausgabe; die Reihenfolge bestimmt der Stil. */
function collectEntries(engine: ReturnType<typeof createEngine>): BibliographyEntry[] {
  const result = engine.makeBibliography()
  if (!result) return []
  const [meta, entries] = result
  const ids = (meta as unknown as { entry_ids: string[][] }).entry_ids
  return entries.map((text, i) => ({ id: ids[i]?.[0] ?? '', text: cleanup(text) }))
}

/**
 * Literaturverzeichnis für eine Titelliste (ohne Dokument-Kontext).
 * Numerische Stile nummerieren in der übergebenen Reihenfolge.
 */
export function formatBibliography(input: EngineInput): BibliographyEntry[] {
  const engine = createEngine(input)
  engine.updateItems(input.items.map((item) => item.id))
  return collectEntries(engine)
}

type DocumentInput = EngineInput & { citations: CitationInput[] }

function renderDocument(input: DocumentInput) {
  const engine = createEngine(input)
  const rendered = engine.rebuildProcessorState(
    input.citations.map((citation) => ({
      citationID: citation.id,
      citationItems: citation.items,
      properties: { noteIndex: 0 },
    })),
    input.format ?? 'html',
  )
  const citations = new Map(rendered.map(([id, , text]) => [id, text]))
  return {
    citations: input.citations.map((c) => ({ id: c.id, text: citations.get(c.id) ?? '' })),
    bibliography: collectEntries(engine),
  }
}

/**
 * Zitate in Dokumentreihenfolge plus passendes Literaturverzeichnis
 * (für das Word-Add-in: Nummern nach erster Zitation).
 */
export function formatDocument(input: DocumentInput) {
  if (!hasLocatorInBibliography(input.styleXml)) return renderDocument(input)
  const { items, citations, locators } = splitByLocator(input.items, input.citations)
  const result = renderDocument({ ...input, items, citations })
  return { ...result, bibliography: appendLocators(result.bibliography, locators) }
}
