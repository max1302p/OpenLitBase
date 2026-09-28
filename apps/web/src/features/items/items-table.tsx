import { de, type Item } from '@litbase/shared'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@litbase/ui/components/table'
import { flexRender, getCoreRowModel, getFilteredRowModel, useReactTable } from '@tanstack/react-table'
import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@litbase/ui/components/button'
import { SearchXIcon } from 'lucide-react'
import { EmptyState } from '@litbase/ui/components/empty-state'
import { itemColumns } from './item-columns'

interface ItemsTableProps {
  items: Item[]
  projectId: string
  loading?: boolean
  /** Suchtext aus der Werkzeugleiste darüber. */
  search: string
  onClearSearch: () => void
}

export function ItemsTable({ items, projectId, loading, search, onClearSearch }: ItemsTableProps) {
  const navigate = useNavigate()
  const columns = useMemo(() => itemColumns(projectId), [projectId])
  const table = useReactTable({
    data: items,
    columns,
    state: { globalFilter: search },
    globalFilterFn: 'includesString',
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })
  const rows = table.getRowModel().rows

  return (
    <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="whitespace-normal">
                  {loading ? (
                    <p className="py-8 text-center text-muted-foreground">{de.common.loading}</p>
                  ) : (
                    <EmptyState
                      size="inline"
                      icon={SearchXIcon}
                      title={de.empty.noMatchesTitle}
                      description={de.empty.noMatchesDescription(search)}
                      action={
                        <Button variant="outline" size="sm" onClick={onClearSearch}>
                          {de.empty.clearSearch}
                        </Button>
                      }
                    />
                  )}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => void navigate(`/projects/${projectId}/items/${row.original.id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="align-top">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
    </div>
  )
}
