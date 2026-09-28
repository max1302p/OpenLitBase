import { Button } from '@litbase/ui/components/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@litbase/ui/components/tooltip'
import type { ReactNode } from 'react'

interface ToolbarButtonProps {
  label: string
  disabled: boolean
  onClick: () => void
  children: ReactNode
}

/** Kleines Symbol-Knopf neben der Projektauswahl, Beschriftung als Tooltip. */
export function ToolbarButton({ label, disabled, onClick, children }: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* span: Tooltips erscheinen auch bei deaktiviertem Knopf (Browser-Vorschau). */}
        <span tabIndex={disabled ? 0 : -1}>
          <Button variant="ghost" size="icon" aria-label={label} disabled={disabled} onClick={onClick}>
            {children}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
