import { de, termMatrixRowKeys, type TermMatrixData } from '@litbase/shared'

/** Begriffsmatrix wie in der Vorlage: eine Zeile pro Teilthema, Spalten = Kategorien (nur lesen). */
export function ProtocolMatrix({ matrix }: { matrix: TermMatrixData }) {
  if (matrix.columns.length === 0) return <p className="text-sm text-muted-foreground">{de.protocol.matrixEmpty}</p>
  const c = de.protocol.matrixColumns
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
          <tr>
            <th className="p-2 font-medium">{c.term}</th>
            {termMatrixRowKeys.map((row) => (
              <th key={row} className="p-2 font-medium">
                {c[row]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.columns.map((column) => (
            <tr key={column.id} className="border-t align-top">
              <td className="p-2 font-medium">{column.title}</td>
              {termMatrixRowKeys.map((row) => (
                <td key={row} className="p-2 text-muted-foreground">
                  {(column.cells[row] ?? []).map((term) => term.text + (term.truncate ? '*' : '')).join(', ')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
