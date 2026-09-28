import { de, type Item, formatAuthors, getYear, itemTitle, typeLabel } from '@litbase/shared'
import { CircleCheckIcon, InfoIcon } from 'lucide-react'

/** Ergebnis nach dem Hinzufügen: was wurde gefunden, und war es neu? */
export function AddedItemCard({ item, created }: { item: Item; created: boolean }) {
  const meta = [formatAuthors(item.csl), getYear(item.csl), typeLabel(item.csl.type)].filter(Boolean).join(' · ')
  const Icon = created ? CircleCheckIcon : InfoIcon

  return (
    <div className="grid gap-3 rounded-xl border bg-accent/40 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-primary">
        <Icon className="size-4" />
        {created ? de.addItem.added : de.addItem.alreadyInLibrary}
      </div>
      <div>
        <p className="font-medium leading-snug">{itemTitle(item.csl)}</p>
        <p className="mt-1 text-sm text-muted-foreground">{meta}</p>
      </div>
    </div>
  )
}
