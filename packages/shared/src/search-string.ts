import type { TermMatrixData, TermMatrixRowKey } from './schemas'

/** Zeilen, die in den Suchstring einfliessen können; `title` = Hauptbegriff im Spaltenkopf. */
export type SearchStringRow = 'title' | TermMatrixRowKey

/** Standard: alles ausser den gegensätzlichen Begriffen. */
export const defaultSearchStringRows: SearchStringRow[] = ['title', 'synonyms', 'broader', 'narrower', 'related', 'english']

/** Phrasen in Anführungszeichen; Trunkierung (`*`) nur bei einzelnen Wörtern. */
export function formatTerm(text: string, truncate = false) {
  const clean = text.replace(/["„“”]/g, '').trim().replace(/\s+/g, ' ')
  if (!clean) return ''
  if (clean.includes(' ')) return `"${clean}"`
  return truncate && !clean.endsWith('*') ? `${clean}*` : clean
}

/**
 * Suchstring aus der Begriffsmatrix: Begriffe einer Spalte mit OR, Spalten mit AND.
 * Leere Spalten fallen weg, doppelte Begriffe (Gross-/Kleinschreibung egal) zählen einmal.
 */
export function buildSearchString(data: TermMatrixData, rows: SearchStringRow[] = defaultSearchStringRows) {
  const groups = data.columns
    .map((column) => {
      const terms = [
        ...(rows.includes('title') ? [{ text: column.title, truncate: false }] : []),
        ...rows.filter((row) => row !== 'title').flatMap((row) => column.cells[row] ?? []),
      ]
      const seen = new Set<string>()
      return terms
        .map((term) => formatTerm(term.text, term.truncate))
        .filter((term) => {
          const key = term.toLocaleLowerCase('de')
          if (!term || seen.has(key)) return false
          seen.add(key)
          return true
        })
    })
    .filter((terms) => terms.length > 0)

  if (groups.length === 0) return ''
  const joined = groups.map((terms) => (terms.length === 1 ? terms[0]! : `(${terms.join(' OR ')})`))
  return joined.length === 1 ? joined[0]!.replace(/^\((.*)\)$/, '$1') : joined.join(' AND ')
}
