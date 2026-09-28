import { de, manualItemTypes, type Identifier, type ManualItemType, typeLabel } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { Label } from '@litbase/ui/components/label'
import { cn } from '@litbase/ui/lib/utils'
import {
  BookIcon,
  FileBadgeIcon,
  GlobeIcon,
  GraduationCapIcon,
  NewspaperIcon,
  PresentationIcon,
  type LucideIcon,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/lib/error-message'
import { formToCsl, type FormValues } from '../csl-form'
import { ItemFields } from '../item-fields'
import { useCreateItem } from '../use-items'

const TYPE_ICONS: Record<ManualItemType, LucideIcon> = {
  book: BookIcon,
  'article-journal': NewspaperIcon,
  webpage: GlobeIcon,
  'paper-conference': PresentationIcon,
  standard: FileBadgeIcon,
  thesis: GraduationCapIcon,
}

/** Aus einer nicht gefundenen Nummer einen passenden Typ und das Feld vorbelegen. */
function prefill(identifier: Identifier | undefined): { type: ManualItemType; values: FormValues } {
  switch (identifier?.type) {
    case 'isbn':
      return { type: 'book', values: { ISBN: identifier.value } }
    case 'url':
      return { type: 'webpage', values: { URL: identifier.value } }
    case 'doi':
      return { type: 'article-journal', values: { DOI: identifier.value } }
    default:
      return { type: 'book', values: {} }
  }
}

interface ManualStepProps {
  projectId: string
  initial?: Identifier
  onDone: () => void
}

export function ManualStep({ projectId, initial, onDone }: ManualStepProps) {
  const start = prefill(initial)
  const [type, setType] = useState<ManualItemType>(start.type)
  const [values, setValues] = useState<FormValues>(start.values)
  const createItem = useCreateItem()
  const navigate = useNavigate()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    createItem.mutate(
      { csl: formToCsl({ type }, values), projectId },
      {
        onSuccess: (item) => {
          toast.success(de.addItem.saved, {
            action: { label: de.addItem.openItem, onClick: () => void navigate(`/projects/${projectId}/items/${item.id}`) },
          })
          onDone()
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <div className="grid gap-2">
        <Label>{de.addItem.chooseType}</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(Object.keys(manualItemTypes) as ManualItemType[]).map((t) => {
            const Icon = TYPE_ICONS[t]
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                aria-pressed={t === type}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent',
                  t === type && 'border-primary bg-accent font-medium text-accent-foreground',
                )}
              >
                <Icon className="size-4 shrink-0" />
                {typeLabel(t)}
              </button>
            )
          })}
        </div>
      </div>
      <ItemFields fields={manualItemTypes[type]} values={values} onChange={setValues} idPrefix="manual" />
      <div className="flex items-center justify-end gap-3">
        {!values.title?.trim() && <p className="mr-auto text-xs text-muted-foreground">{de.addItem.requiredTitle}</p>}
        <Button type="submit" disabled={!values.title?.trim() || createItem.isPending}>
          {de.addItem.save}
        </Button>
      </div>
    </form>
  )
}
