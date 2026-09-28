import { de, type Me } from '@litbase/shared'
import { AccountSummary } from '@litbase/ui/components/account-summary'
import { Button } from '@litbase/ui/components/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@litbase/ui/components/tooltip'
import { LogOut } from 'lucide-react'

interface AccountBarProps {
  me: Me
  isMulti: boolean
  /** Nur mit gespeichertem API-Token gibt es etwas zu trennen. */
  onDisconnect?: () => void
}

export function AccountBar({ me, isMulti, onDisconnect }: AccountBarProps) {
  const action = onDisconnect && (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={de.addin.disconnect} onClick={onDisconnect}>
          <LogOut />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{de.addin.disconnect}</TooltipContent>
    </Tooltip>
  )
  return <AccountSummary me={me} isMulti={isMulti} action={action} />
}
