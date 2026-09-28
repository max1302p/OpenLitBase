import { de, type Term } from '@litbase/shared'
import { Badge } from '@litbase/ui/components/badge'
import { cn } from '@litbase/ui/lib/utils'
import { XIcon } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'

interface TermCellProps {
  terms: Term[]
  onChange: (terms: Term[]) => void
  readOnly?: boolean
}

/** Begriffe als Chips: Enter fügt hinzu („;“ trennt mehrere), Klick schaltet die Trunkierung. */
export function TermCell({ terms, onChange, readOnly }: TermCellProps) {
  const [draft, setDraft] = useState('')

  function add() {
    const existing = new Set(terms.map((t) => t.text.toLocaleLowerCase('de')))
    const added = draft
      .split(';')
      .map((text) => text.trim())
      .filter((text) => text && !existing.has(text.toLocaleLowerCase('de')) && existing.add(text.toLocaleLowerCase('de')))
    if (added.length > 0) onChange([...terms, ...added.map((text) => ({ text, truncate: false }))])
    setDraft('')
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      add()
    } else if (event.key === 'Backspace' && !draft && terms.length > 0) {
      onChange(terms.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {terms.map((term, i) => {
        const phrase = /\s/.test(term.text)
        return (
          <Badge key={term.text} variant={term.truncate ? 'default' : 'secondary'} className="gap-0.5 pr-1 font-normal">
            <button
              type="button"
              disabled={phrase || readOnly}
              title={phrase || readOnly ? undefined : de.termMatrix.truncateHint}
              className={cn(!phrase && !readOnly && 'cursor-pointer')}
              onClick={() => onChange(terms.map((t, j) => (j === i ? { ...t, truncate: !t.truncate } : t)))}
            >
              {term.text}
              {term.truncate && !phrase && '*'}
            </button>
            {!readOnly && <button
              type="button"
              onClick={() => onChange(terms.filter((_, j) => j !== i))}
              className="rounded-sm opacity-60 hover:opacity-100"
              aria-label={de.termMatrix.removeTerm(term.text)}
            >
              <XIcon className="size-3" />
            </button>}
          </Badge>
        )
      })}
      {!readOnly && <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={add}
        placeholder={de.termMatrix.termPlaceholder}
        className="min-w-24 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground/60"
      />}
    </div>
  )
}
