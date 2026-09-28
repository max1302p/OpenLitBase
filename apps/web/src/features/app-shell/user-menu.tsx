import { de } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@litbase/ui/components/dropdown-menu'
import { useQueryClient } from '@tanstack/react-query'
import { FileTextIcon, LogOutIcon, SettingsIcon, ShieldIcon } from 'lucide-react'
import { useNavigate } from 'react-router'
import { InstitutionLogo } from '@litbase/ui/components/institution-logo'
import { UserAvatar } from '@litbase/ui/components/user-avatar'
import { authClient } from '@/lib/auth-client'
import { useLegalLinks } from '../auth/legal-links'
import { useConfig, useMe } from '../auth/use-session'

/** Konto oben rechts in der Topbar. Im Modus "single" ohne Abmelden. */
export function UserMenu() {
  const me = useMe()
  const isMulti = useConfig().data?.authMode === 'multi'
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const legal = useLegalLinks()
  if (!me.data) return null

  async function signOut() {
    await authClient.signOut()
    queryClient.clear()
    void navigate('/login', { replace: true })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full" aria-label={de.userMenu.open}>
          <UserAvatar userId={me.data.id} name={me.data.name} className="size-8 rounded-full" />
          {/* Institution klein und rund unten links am Avatar */}
          {me.data.institution && (
            <InstitutionLogo
              name={me.data.institution.name}
              logoUrl={me.data.institution.logoUrl}
              className="absolute -bottom-0.5 -left-0.5 size-4 rounded-full ring-2 ring-background"
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-3 font-normal">
          <UserAvatar userId={me.data.id} name={me.data.name} className="size-9" />
          <div className="grid min-w-0 text-sm leading-tight">
            <span className="truncate font-medium text-foreground">{me.data.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {isMulti ? me.data.email : de.userMenu.localMode}
            </span>
            {me.data.institution && (
              <span className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                <InstitutionLogo
                  name={me.data.institution.name}
                  logoUrl={me.data.institution.logoUrl}
                  className="size-4 rounded-full"
                />
                <span className="truncate">{me.data.institution.name}</span>
              </span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void navigate('/settings')}>
          <SettingsIcon /> {de.userMenu.settings}
        </DropdownMenuItem>
        {me.data.isAdmin && (
          <DropdownMenuItem onClick={() => void navigate('/admin')}>
            <ShieldIcon /> {de.userMenu.admin}
          </DropdownMenuItem>
        )}
        {legal.length > 0 && (
          <>
            <DropdownMenuSeparator />
            {legal.map((l) => (
              <DropdownMenuItem key={l.url} asChild>
                <a href={l.url} target="_blank" rel="noopener">
                  <FileTextIcon /> {l.label}
                </a>
              </DropdownMenuItem>
            ))}
          </>
        )}
        {isMulti && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void signOut()}>
              <LogOutIcon /> {de.auth.signOut}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
