import { de, type MemberRole } from '@litbase/shared'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@litbase/ui/components/select'

interface RoleSelectProps {
  value: MemberRole
  onChange: (role: MemberRole) => void
  disabled?: boolean
  id?: string
}

/** „Bearbeiten“ oder „Lesen“, jeweils mit kurzer Erklärung. */
export function RoleSelect({ value, onChange, disabled, id }: RoleSelectProps) {
  return (
    <Select value={value} onValueChange={(role) => onChange(role as MemberRole)} disabled={disabled}>
      <SelectTrigger id={id} className="w-36" size="sm">
        <SelectValue>{de.sharing.roles[value]}</SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {(['editor', 'viewer'] as const).map((role) => (
          <SelectItem key={role} value={role}>
            <div className="grid">
              <span>{de.sharing.roles[role]}</span>
              <span className="text-xs text-muted-foreground">{de.sharing.roleHints[role]}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
