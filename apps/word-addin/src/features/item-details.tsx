import { de, formatName, getYear, typeLabel, type CslItem, type Item } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { Input } from '@litbase/ui/components/input'
import { Label } from '@litbase/ui/components/label'
import { Loader2, TextCursorInput } from 'lucide-react'
import { useState, type FormEvent } from 'react'

const FIELDS = ['author', 'editor', 'issued', 'container-title', 'edition', 'volume', 'issue', 'page', 'publisher', 'DOI', 'ISBN', 'URL'] as const

function fieldValue(csl: CslItem, field: (typeof FIELDS)[number]) {
  if (field === 'author' || field === 'editor') return csl[field]?.map(formatName).join('; ')
  if (field === 'issued') return getYear(csl)
  if (field === 'publisher') return [csl.publisher, csl['publisher-place']].filter(Boolean).join(', ')
  const value = csl[field]
  return value == null ? undefined : String(value)
}

interface ItemDetailsProps {
  item: Item
  disabled: boolean
  pending: boolean
  onInsert: (locator: string | undefined) => void
}

/** Infomaske eines Titels: Angaben, Seite und „An dieser Stelle einfügen“. */
export function ItemDetails({ item, disabled, pending, onInsert }: ItemDetailsProps) {
  const [locator, setLocator] = useState('')
  const rows = [
    [de.items.typeLabel, typeLabel(item.csl.type)],
    ...FIELDS.map((field) => [de.itemFields[field] ?? field, fieldValue(item.csl, field)]),
  ].filter((row): row is [string, string] => Boolean(row[1]))
  const locatorId = `locator-${item.id}`

  function submit(event: FormEvent) {
    event.preventDefault()
    onInsert(locator.trim() || undefined)
  }

  return (
    <div className="space-y-3 px-3 pb-3">
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="min-w-0 break-words">{value}</dd>
          </div>
        ))}
      </dl>
      <form onSubmit={submit} className="flex items-end gap-2">
        <div className="w-20 space-y-1">
          <Label htmlFor={locatorId} className="text-xs">
            {de.addin.locator}
          </Label>
          <Input
            id={locatorId}
            value={locator}
            onChange={(e) => setLocator(e.target.value)}
            placeholder={de.addin.locatorPlaceholder}
          />
        </div>
        <Button type="submit" className="flex-1" disabled={disabled}>
          {pending ? <Loader2 className="animate-spin" /> : <TextCursorInput />}
          {pending ? de.addin.citing : de.addin.insertHere}
        </Button>
      </form>
    </div>
  )
}
