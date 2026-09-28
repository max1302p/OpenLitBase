import { avatarUrl } from '@litbase/shared'
import { Avatar, AvatarFallback, AvatarImage } from '@litbase/ui/components/avatar'
import { cn } from '@litbase/ui/lib/utils'

interface UserAvatarProps {
  userId: string
  name: string
  className?: string
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

/** DiceBear-Avatar mit Initialen als Fallback (z. B. offline). */
export function UserAvatar({ userId, name, className }: UserAvatarProps) {
  return (
    <Avatar className={cn('size-8 rounded-lg', className)}>
      <AvatarImage src={avatarUrl(userId)} alt="" referrerPolicy="no-referrer" />
      <AvatarFallback className="rounded-lg text-xs">{initials(name)}</AvatarFallback>
    </Avatar>
  )
}
