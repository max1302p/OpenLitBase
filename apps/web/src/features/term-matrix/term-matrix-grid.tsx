import { de, termMatrixRowKeys, type TermMatrixColumn, type TermMatrixData } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { PlusIcon } from 'lucide-react'
import { ColumnHeader } from './column-header'
import { TermCell } from './term-cell'

interface TermMatrixGridProps {
  data: TermMatrixData
  onChange: (data: TermMatrixData) => void
  onAddColumn: () => void
  /** Nur lesen: keine Eingaben, kein Hinzufügen/Entfernen. */
  readOnly?: boolean
}

/** Spalten = Teilthemen, Zeilen = feste Kategorien (gängige Bibliotheksvorlage). */
export function TermMatrixGrid({ data, onChange, onAddColumn, readOnly }: TermMatrixGridProps) {
  const update = (id: string, patch: Partial<TermMatrixColumn>) =>
    onChange({ columns: data.columns.map((c) => (c.id === id ? { ...c, ...patch } : c)) })

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="sticky left-0 z-10 w-44 min-w-44 bg-muted p-3 text-left font-medium text-muted-foreground" />
            {data.columns.map((column) => (
              <th key={column.id} className="min-w-64 border-l p-2 text-left align-top">
                {readOnly ? (
                  <span className="block px-1 py-1.5 font-semibold">{column.title}</span>
                ) : (
                  <ColumnHeader
                    column={column}
                    onRename={(title) => update(column.id, { title })}
                    onRemove={() => onChange({ columns: data.columns.filter((c) => c.id !== column.id) })}
                  />
                )}
              </th>
            ))}
            {!readOnly && (
              <th className="w-44 border-l p-2 text-left">
                <Button variant="ghost" size="sm" onClick={onAddColumn} disabled={data.columns.length >= 20}>
                  <PlusIcon /> {de.termMatrix.addColumn}
                </Button>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {termMatrixRowKeys.map((row) => (
            <tr key={row} className="border-b last:border-b-0">
              <th scope="row" className="sticky left-0 z-10 bg-background p-3 text-left align-top font-medium">
                {de.termMatrix.rows[row]}
              </th>
              {data.columns.map((column) => (
                <td key={column.id} className="border-l p-2 align-top">
                  <TermCell
                    terms={column.cells[row] ?? []}
                    onChange={(terms) => update(column.id, { cells: { ...column.cells, [row]: terms } })}
                    readOnly={readOnly}
                  />
                </td>
              ))}
              {!readOnly && <td className="border-l" />}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
