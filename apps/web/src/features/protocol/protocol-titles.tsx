import { formatAuthors, getYear, itemTitle, typeLabel, type Item, type ProtocolEntry } from '@litbase/shared'
import { Link } from 'react-router'
import { ProtocolFields } from './protocol-fields'
import { useSaveItemProtocol } from './use-protocol'

interface ProtocolTitlesProps {
  projectId: string
  entries: ProtocolEntry[]
  items: Item[]
  readOnly: boolean
}

/** Liste der recherchierten Titel: pro Titel Nummer, Typ und die drei Felder der Vorlage. */
export function ProtocolTitles({ projectId, entries, items, readOnly }: ProtocolTitlesProps) {
  const save = useSaveItemProtocol(projectId)
  const byId = new Map(items.map((item) => [item.id, item]))
  return (
    <ol className="divide-y rounded-xl border">
      {entries.map((entry) => {
        const item = byId.get(entry.itemId)
        return (
          <li key={entry.itemId} className="grid gap-3 p-4">
            <div className="flex items-baseline gap-3">
              <span className="w-10 shrink-0 font-mono text-sm text-muted-foreground">[{entry.number}]</span>
              <div className="grid min-w-0 flex-1 gap-0.5">
                <Link to={`/projects/${projectId}/items/${entry.itemId}`} className="truncate font-medium hover:underline">
                  {item ? itemTitle(item.csl) : entry.itemId}
                </Link>
                <span className="truncate text-xs text-muted-foreground">
                  {[item && formatAuthors(item.csl, 2), item && getYear(item.csl), typeLabel(entry.type)].filter(Boolean).join(' · ')}
                </span>
              </div>
            </div>
            <ProtocolFields
              key={entry.itemId}
              idPrefix={`protocol-${entry.itemId}`}
              protocol={entry.protocol}
              readOnly={readOnly}
              onSave={(protocol) => save.mutate({ itemId: entry.itemId, protocol })}
              className="md:pl-13"
            />
          </li>
        )
      })}
    </ol>
  )
}
