import { de, type ItemProtocol } from '@litbase/shared'
import { Label } from '@litbase/ui/components/label'
import { Textarea } from '@litbase/ui/components/textarea'
import { cn } from '@litbase/ui/lib/utils'
import { useState } from 'react'

const fields = ['citation', 'keywords', 'suitability'] as const
type Field = (typeof fields)[number]

interface ProtocolFieldsProps {
  idPrefix: string
  protocol: ItemProtocol
  readOnly: boolean
  /** Wird beim Verlassen eines geänderten Felds aufgerufen. */
  onSave: (protocol: ItemProtocol) => void
  className?: string
}

/** Die drei Felder der Vorlage; speichert beim Verlassen des Felds (kein Speichern-Knopf). */
export function ProtocolFields({ idPrefix, protocol, readOnly, onSave, className }: ProtocolFieldsProps) {
  const [values, setValues] = useState<Record<Field, string>>(() => ({
    citation: protocol.citation ?? '',
    keywords: protocol.keywords ?? '',
    suitability: protocol.suitability ?? '',
  }))

  function save(field: Field) {
    if (values[field].trim() === (protocol[field] ?? '')) return
    onSave({ ...protocol, [field]: values[field].trim() || undefined })
  }

  return (
    <div className={cn('grid gap-3 md:grid-cols-3', className)}>
      {fields.map((field) => (
        <div key={field} className="grid content-start gap-1.5">
          <Label htmlFor={`${idPrefix}-${field}`} className="text-xs text-muted-foreground">
            {de.protocol.columns[field]}
          </Label>
          {readOnly ? (
            <p className="text-sm whitespace-pre-line">{values[field] || '–'}</p>
          ) : (
            <Textarea
              id={`${idPrefix}-${field}`}
              rows={2}
              value={values[field]}
              onChange={(e) => setValues({ ...values, [field]: e.target.value })}
              onBlur={() => save(field)}
              placeholder={de.protocol.placeholders[field]}
              className="min-h-16 resize-y text-sm"
            />
          )}
        </div>
      ))}
    </div>
  )
}
