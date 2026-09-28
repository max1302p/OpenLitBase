import { normalizeDoi, normalizeIsbn, type CslItem } from '@litbase/shared'

/** Abgeleitete Spalten für Suche/Duplikaterkennung. Quelle der Wahrheit bleibt das CSL-JSON. */
export function deriveColumns(csl: CslItem) {
  const doi = csl.DOI ? (normalizeDoi(csl.DOI)?.toLowerCase() ?? null) : null
  const isbnRaw = typeof csl.ISBN === 'string' ? csl.ISBN.split(/[\s,;]+/)[0] : undefined
  const isbn = isbnRaw ? (normalizeIsbn(isbnRaw) ?? null) : null
  const url = typeof csl.URL === 'string' && csl.URL ? csl.URL : null
  return { doi, isbn, url }
}

/** `id` gehört nicht ins gespeicherte CSL – die Item-ID wird beim Formatieren eingesetzt. */
export function stripCslId({ id: _id, ...csl }: CslItem): CslItem {
  return csl
}
