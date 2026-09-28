import { buildSearchString, de, formatTerm, termMatrixRowKeys, type SearchStringRow, type TermMatrixData } from '@litbase/shared'
import type { TableExport } from './tables'

/** Matrix wie im Web: Zeilen = Kategorien, Spalten = Teilthemen; darunter der Suchstring. */
export function termMatrixTable(projectName: string, data: TermMatrixData, rows: SearchStringRow[]): TableExport {
  const t = de.termMatrix
  const searchString = buildSearchString(data, rows)
  return {
    title: `${t.title}: ${projectName}`,
    headers: ['', ...data.columns.map((column) => column.title)],
    rows: termMatrixRowKeys.map((row) => [
      t.rows[row],
      ...data.columns.map((column) => (column.cells[row] ?? []).map((term) => formatTerm(term.text, term.truncate)).join('\n')),
    ]),
    after: searchString ? [{ label: t.searchString, text: searchString }] : [],
  }
}
