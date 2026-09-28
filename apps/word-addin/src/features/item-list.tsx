import { de, formatAuthors, getYear, itemTitle, type Item } from '@litbase/shared'
import { EmptyState } from '@litbase/ui/components/empty-state'
import { Input } from '@litbase/ui/components/input'
import { BookOpen, SearchX } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ItemRow } from './item-row'

interface ItemListProps {
  items: Item[]
  disabled: boolean
  /** ID des Titels, der gerade eingefügt wird. */
  pendingId: string | undefined
  onInsert: (itemId: string, locator: string | undefined) => void
}

function searchText(item: Item) {
  return [itemTitle(item.csl), formatAuthors(item.csl, 99), getYear(item.csl), item.doi, item.isbn]
    .join(' ')
    .toLocaleLowerCase('de')
}

export function ItemList({ items, disabled, pendingId, onInsert }: ItemListProps) {
  const [query, setQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string>()
  const indexed = useMemo(() => items.map((item) => ({ item, text: searchText(item) })), [items])
  const words = query.toLocaleLowerCase('de').split(/\s+/).filter(Boolean)
  const visible = indexed.filter(({ text }) => words.every((w) => text.includes(w))).map(({ item }) => item)

  if (items.length === 0) {
    return (
      <EmptyState icon={BookOpen} size="inline" title={de.addin.noItemsTitle} description={de.addin.noItemsDescription} />
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="space-y-1">
        <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={de.addin.search} />
        <p className="text-xs text-muted-foreground">{de.addin.doubleClickHint}</p>
      </div>
      <div className="-mx-1 min-h-0 flex-1 space-y-1 overflow-y-auto px-1">
        {visible.length === 0 ? (
          <EmptyState icon={SearchX} size="inline" title={de.empty.noMatchesTitle} description={de.empty.noMatchesDescription(query)} />
        ) : (
          visible.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              expanded={expandedId === item.id}
              disabled={disabled}
              pending={pendingId === item.id}
              onToggle={() => setExpandedId((current) => (current === item.id ? undefined : item.id))}
              onInsert={(locator) => onInsert(item.id, locator)}
            />
          ))
        )}
      </div>
    </div>
  )
}
