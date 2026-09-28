import { initialsAvatarUrl } from '@litbase/shared'
import { Avatar, AvatarFallback, AvatarImage } from '@litbase/ui/components/avatar'
import { cn } from '@litbase/ui/lib/utils'

/** „HSM – Hochschule Musterstadt“ → „HSM“; sonst Anfangsbuchstaben (max. 2). */
export function initials(name: string) {
  const acronym = name.split(/\s[–-]\s/)[0]?.trim()
  if (acronym && /^[\p{Lu}\d&]{2,4}$/u.test(acronym)) return acronym
  return name
    .split(/[\s–-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
}

interface InitialsAvatarProps {
  name: string
  className?: string
}

/** DiceBear-Initialen für Projekte und Institutionen ohne Logo; offline lokale Initialen. */
export function InitialsAvatar({ name, className }: InitialsAvatarProps) {
  return (
    <Avatar className={cn('size-10 rounded-md', className)}>
      <AvatarImage src={initialsAvatarUrl(name)} alt="" referrerPolicy="no-referrer" />
      <AvatarFallback className="rounded-md bg-primary text-[0.65rem] font-semibold text-primary-foreground">
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
