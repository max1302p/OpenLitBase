import { de, type Me } from '@litbase/shared'
import { InstitutionLogo } from '@litbase/ui/components/institution-logo'
import { UserAvatar } from '@litbase/ui/components/user-avatar'
import type { ReactNode } from 'react'

interface AccountSummaryProps {
  me: Me
  isMulti: boolean
  /** Server-Adresse für das Institutionslogo, wenn nicht dieselbe Origin (Extension). */
  serverUrl?: string
  /** Z. B. ein Knopf zum Trennen rechts. */
  action?: ReactNode
}

/** Kontozeile für Add-in und Extension: Avatar, Name, E-Mail und Institution mit Logo. */
export function AccountSummary({ me, isMulti, serverUrl, action }: AccountSummaryProps) {
  return (
    <div className="flex items-center gap-3 border-b px-4 py-2.5">
      <UserAvatar userId={me.id} name={me.name} className="size-9 shrink-0 rounded-full" />
      <div className="grid min-w-0 flex-1 text-sm leading-tight">
        <span className="truncate font-medium">{me.name}</span>
        <span className="truncate text-xs text-muted-foreground">{isMulti ? me.email : de.userMenu.localMode}</span>
        {me.institution && (
          <span className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <InstitutionLogo name={me.institution.name} logoUrl={me.institution.logoUrl} serverUrl={serverUrl} className="size-4 rounded-full" />
            <span className="truncate">{me.institution.name}</span>
          </span>
        )}
      </div>
      {action}
    </div>
  )
}
