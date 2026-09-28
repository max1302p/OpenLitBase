import { formatAuthors, getYear, itemTitle, type Item } from '@litbase/shared'
import { cn } from '@litbase/ui/lib/utils'
import { ChevronDown } from 'lucide-react'
import { ItemDetails } from './item-details'

interface ItemRowProps {
  item: Item
  expanded: boolean
  /** Einfügen gerade nicht möglich (nicht in Word, anderer Vorgang läuft). */
  disabled: boolean
  pending: boolean
  onToggle: () => void
  onInsert: (locator: string | undefined) => void
}

/** Klick klappt die Infomaske auf, Doppelklick fügt ohne Seitenangabe ein. */
export function ItemRow({ item, expanded, disabled, pending, onToggle, onInsert }: ItemRowProps) {
  const meta = [formatAuthors(item.csl, 2), getYear(item.csl)].filter(Boolean).join(' · ')
  return (
    <div className={cn('rounded-lg border transition-colors', expanded ? 'border-primary/40 bg-accent/40' : 'border-transparent hover:bg-muted')}>
      <button
        type="button"
        aria-expanded={expanded}
        // Der zweite Klick eines Doppelklicks soll die Maske nicht gleich wieder schliessen.
        onClick={(e) => e.detail <= 1 && onToggle()}
        onDoubleClick={() => !disabled && onInsert(undefined)}
        className="flex w-full items-start gap-2 px-3 py-2 text-left select-none"
      >
        <span className="min-w-0 flex-1 space-y-0.5">
          <span className={cn('block text-sm font-medium', !expanded && 'line-clamp-2')}>{itemTitle(item.csl)}</span>
          {meta && <span className="block truncate text-xs text-muted-foreground">{meta}</span>}
        </span>
        <ChevronDown className={cn('mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
      </button>
      {expanded && <ItemDetails item={item} disabled={disabled} pending={pending} onInsert={onInsert} />}
    </div>
  )
}
