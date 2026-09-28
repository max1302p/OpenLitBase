import { Button } from '@litbase/ui/components/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@litbase/ui/components/dropdown-menu'
import { FileDownIcon } from 'lucide-react'

interface DownloadMenuProps {
  label: string
  options: { label: string; href: string }[]
  disabled?: boolean
}

/** Knopf mit Dateiformaten zum Herunterladen (Links auf Export-Endpunkte der API). */
export function DownloadMenu({ label, options, disabled }: DownloadMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button variant="outline">
          <FileDownIcon /> {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map((option) => (
          <DropdownMenuItem key={option.href} asChild>
            <a href={option.href} download>
              {option.label}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
