import { Badge } from '@litbase/ui/components/badge'
import { Input } from '@litbase/ui/components/input'
import { XIcon } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'

interface ChipInputProps {
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  removeLabel?: (value: string) => string
}

/** Begriffe als Chips; Enter fügt hinzu, Backspace im leeren Feld entfernt den letzten. */
export function ChipInput({ values, onChange, placeholder, removeLabel }: ChipInputProps) {
  const [draft, setDraft] = useState('')

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const text = draft.trim()
    if (event.key === 'Enter') {
      event.preventDefault()
      if (text && !values.includes(text)) onChange([...values, text])
      setDraft('')
    } else if (event.key === 'Backspace' && !draft && values.length > 0) {
      onChange(values.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((value) => (
            <Badge key={value} variant="secondary" className="gap-1 pr-1">
              {value}
              <button
                type="button"
                onClick={() => onChange(values.filter((v) => v !== value))}
                className="rounded-sm opacity-60 hover:opacity-100"
                aria-label={removeLabel?.(value) ?? value}
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <Input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={handleKeyDown} placeholder={placeholder} />
    </div>
  )
}
