import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@litbase/ui/components/select'
import { useStyles } from './use-styles'

/** Sentinel für „kein eigener Stil“ (Radix-Select erlaubt keinen leeren Wert). */
export const DEFAULT_STYLE_VALUE = '__default__'

interface StyleSelectProps {
  value: string
  onChange: (value: string) => void
  /** Zusätzliche Option „Account-Standard (…)“ für Projekte. */
  defaultOptionLabel?: string
  id?: string
}

export function StyleSelect({ value, onChange, defaultOptionLabel, id }: StyleSelectProps) {
  const styles = useStyles()

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {defaultOptionLabel && <SelectItem value={DEFAULT_STYLE_VALUE}>{defaultOptionLabel}</SelectItem>}
        {styles.data?.map((style) => (
          <SelectItem key={style.id} value={style.id}>
            {style.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
