import { de, detectIdentifier, type AddByIdentifierResult, type Identifier } from '@litbase/shared'
import { Badge } from '@litbase/ui/components/badge'
import { Button } from '@litbase/ui/components/button'
import { Input } from '@litbase/ui/components/input'
import { Label } from '@litbase/ui/components/label'
import { Loader2Icon, SearchIcon, TriangleAlertIcon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { errorMessage } from '@/lib/error-message'
import { useAddByIdentifier } from '../use-items'
import { AddedItemCard } from './added-item-card'

const EXAMPLES = ['10.1038/nature14539', '978-3-658-31979-3', 'arXiv:1706.03762', 'PMID 26017442']

interface IdentifierStepProps {
  projectId: string
  onDone: () => void
  /** Nichts gefunden → manuell weiter, mit dem Erkannten vorausgefüllt. */
  onManual: (identifier: Identifier | undefined) => void
}

export function IdentifierStep({ projectId, onDone, onManual }: IdentifierStepProps) {
  const [value, setValue] = useState('')
  const [result, setResult] = useState<AddByIdentifierResult>()
  const addItem = useAddByIdentifier()
  const navigate = useNavigate()
  const detected = detectIdentifier(value)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!detected) return
    addItem.mutate({ input: value, projectId }, { onSuccess: setResult })
  }

  if (result) {
    return (
      <div className="grid gap-4">
        <AddedItemCard item={result.item} created={result.created} />
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={() => void navigate(`/projects/${projectId}/items/${result.item.id}`)}>
            {de.addItem.openItem}
          </Button>
          <Button variant="outline" onClick={() => (setResult(undefined), setValue(''), addItem.reset())}>
            {de.addItem.addAnother}
          </Button>
          <Button onClick={onDone}>{de.addItem.done}</Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="add-identifier">{de.addItem.identifierLabel}</Label>
        <Input
          id="add-identifier"
          value={value}
          onChange={(e) => (setValue(e.target.value), addItem.reset())}
          placeholder={de.addItem.identifierPlaceholder}
          disabled={addItem.isPending}
          autoFocus
          className="h-11 text-base"
        />
        <p className="text-xs text-muted-foreground">
          {detected ? (
            <Badge variant="secondary">{de.addItem.detectedAs(de.items.detected[detected.type])}</Badge>
          ) : (
            de.addItem.notDetected
          )}
        </p>
      </div>

      {!value && (
        <div className="grid gap-2">
          <p className="text-xs text-muted-foreground">{de.addItem.examples}</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <button key={example} type="button" onClick={() => setValue(example)}>
                <Badge variant="outline" className="cursor-pointer font-mono hover:bg-accent">
                  {example}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {addItem.isError && (
        <div className="grid gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p className="flex items-center gap-2 font-medium text-destructive">
            <TriangleAlertIcon className="size-4" /> {errorMessage(addItem.error)}
          </p>
          <div>
            <Button type="button" variant="outline" size="sm" onClick={() => onManual(detected)}>
              {de.addItem.tryManual}
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        {addItem.isPending && <p className="mr-auto text-xs text-muted-foreground">{de.addItem.searchingHint}</p>}
        <Button type="submit" disabled={!detected || addItem.isPending}>
          {addItem.isPending ? <Loader2Icon className="animate-spin" /> : <SearchIcon />}
          {addItem.isPending ? de.addItem.searching : de.addItem.search}
        </Button>
      </div>
    </form>
  )
}
