import { de, type Item, formatAuthors, getYear, itemTitle, typeLabel } from '@litbase/shared'
import { Badge } from '@litbase/ui/components/badge'
import type { ColumnDef } from '@tanstack/react-table'
import { ItemRowActions } from './item-row-actions'

export function itemColumns(projectId: string): ColumnDef<Item>[] {
  return [
    {
      id: 'title',
      header: de.items.columns.title,
      accessorFn: (item) => itemTitle(item.csl),
      cell: ({ getValue }) => <span className="line-clamp-2 font-medium whitespace-normal">{String(getValue())}</span>,
    },
    {
      id: 'authors',
      header: de.items.columns.authors,
      accessorFn: (item) => formatAuthors(item.csl),
      cell: ({ getValue }) => <span className="line-clamp-1 whitespace-normal">{String(getValue())}</span>,
    },
    { id: 'year', header: de.items.columns.year, accessorFn: (item) => getYear(item.csl) },
    { id: 'type', header: de.items.columns.type, accessorFn: (item) => typeLabel(item.csl.type) },
    {
      id: 'tags',
      header: de.items.columns.tags,
      accessorFn: (item) => item.tags.join(' '),
      cell: ({ row }) => (
        <div className="flex max-w-56 flex-wrap gap-1">
          {row.original.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
          {row.original.tags.length > 3 && <Badge variant="outline">+{row.original.tags.length - 3}</Badge>}
        </div>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">{de.items.actions}</span>,
      cell: ({ row }) => <ItemRowActions item={row.original} projectId={projectId} />,
      enableGlobalFilter: false,
    },
  ]
}
