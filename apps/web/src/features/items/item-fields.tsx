import { de, nameFields, type ItemField } from '@litbase/shared'
import { Input } from '@litbase/ui/components/input'
import { Label } from '@litbase/ui/components/label'
import type { FormValues } from './csl-form'

interface ItemFieldsProps {
  fields: readonly ItemField[]
  values: FormValues
  onChange: (values: FormValues) => void
  idPrefix: string
}

function hint(field: ItemField) {
  if ((nameFields as readonly string[]).includes(field)) return de.items.namesHint
  if (field === 'issued' || field === 'accessed') return de.items.dateHint
  return undefined
}

/** Eingabefelder für die CSL-Felder eines Titeltyps. */
export function ItemFields({ fields, values, onChange, idPrefix }: ItemFieldsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map((field) => {
        const id = `${idPrefix}-${field}`
        const wide = field === 'title' || field === 'author' || field === 'container-title'
        return (
          <div key={field} className={wide ? 'grid gap-1.5 sm:col-span-2' : 'grid gap-1.5'}>
            <Label htmlFor={id}>{de.itemFields[field] ?? field}</Label>
            <Input
              id={id}
              value={values[field] ?? ''}
              onChange={(e) => onChange({ ...values, [field]: e.target.value })}
              placeholder={hint(field)}
            />
          </div>
        )
      })}
    </div>
  )
}
