import { de, itemFields, manualItemTypes, type Item, type ItemField, typeLabel } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@litbase/ui/components/card'
import { Label } from '@litbase/ui/components/label'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/lib/error-message'
import { cslToForm, formToCsl, type FormValues } from './csl-form'
import { ItemFields } from './item-fields'
import { useProjectPermissions } from '../projects/use-permissions'
import { useUpdateItem } from './use-items'

/** Felder des Typs plus alle weiteren bereits befüllten Standardfelder. */
function fieldsFor(item: Item): ItemField[] {
  const typeFields = (manualItemTypes as Record<string, readonly ItemField[]>)[item.csl.type] ?? []
  const filled = itemFields.filter((f) => item.csl[f] != null && !typeFields.includes(f))
  const base = typeFields.length > 0 ? typeFields : (['title', 'author', 'container-title', 'publisher', 'issued', 'DOI', 'URL'] as const)
  return [...base, ...filled]
}

export function ItemMetadataCard({ item }: { item: Item }) {
  const fields = fieldsFor(item)
  const [values, setValues] = useState<FormValues>(() => cslToForm(item.csl, fields))
  const updateItem = useUpdateItem(item.id)
  const { canEdit } = useProjectPermissions()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    updateItem.mutate(
      { csl: formToCsl(item.csl, values) },
      { onSuccess: () => toast.success(de.items.saved), onError: (e) => toast.error(errorMessage(e)) },
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{de.items.metadata}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Nur Lesen: alle Felder gesperrt, kein Speichern. */}
        <form onSubmit={handleSubmit}>
          <fieldset disabled={!canEdit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>{de.items.typeLabel}</Label>
            <p className="text-sm">{typeLabel(item.csl.type)}</p>
          </div>
          <ItemFields fields={fields} values={values} onChange={setValues} idPrefix="item" />
          {canEdit && (
            <div>
              <Button type="submit" disabled={updateItem.isPending}>
                {de.common.save}
              </Button>
            </div>
          )}
          </fieldset>
        </form>
      </CardContent>
    </Card>
  )
}
