import { de, exportFormats } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@litbase/ui/components/dropdown-menu'
import { FileDownIcon } from 'lucide-react'
import { api } from '@/lib/api'

export function ExportMenu({ projectId }: { projectId: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <FileDownIcon /> {de.importExport.export}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {exportFormats.map((format) => (
          <DropdownMenuItem key={format} asChild>
            <a href={api.urls.export(format, projectId)} download>
              {de.importExport.formats[format]}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
