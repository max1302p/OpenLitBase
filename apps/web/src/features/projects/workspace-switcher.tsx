import { de, isSharedProject } from '@litbase/shared'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@litbase/ui/components/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@litbase/ui/components/sidebar'
import { CheckIcon, ChevronsUpDownIcon, PlusIcon, UsersIcon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { InitialsAvatar } from '@litbase/ui/components/initials-avatar'
import { useSettings, useStyleTitle } from '../citation/use-styles'
import { CreateProjectDialog } from './create-project-dialog'
import { useActiveProject } from './use-projects'

/** Projekt-Umschalter oben in der Sidebar (inkl. „Neues Projekt“). */
export function WorkspaceSwitcher() {
  const { project, projects } = useActiveProject()
  const { isMobile } = useSidebar()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  // Tatsächlich geltender Stil: eigener Projektstil oder Account-Standard.
  const settings = useSettings()
  const styleTitle = useStyleTitle(project?.citationStyle ?? settings.data?.citationStyle)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent" tooltip={de.workspace.switch}>
              {project ? (
                <InitialsAvatar name={project.name} className="size-8" />
              ) : (
                <div className="size-8 rounded-md border border-dashed" />
              )}
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="truncate">{project?.name ?? de.workspace.none}</span>
                  {project && isSharedProject(project) && <UsersIcon className="size-3.5 shrink-0 text-muted-foreground" aria-label={de.sharing.shared} />}
                </span>
                <span className="truncate text-xs text-muted-foreground">{project && styleTitle}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-60" align="start" side={isMobile ? 'bottom' : 'right'}>
            <DropdownMenuLabel className="text-xs text-muted-foreground">{de.workspace.label}</DropdownMenuLabel>
            {projects.map((p) => (
              <DropdownMenuItem key={p.id} onClick={() => void navigate(`/projects/${p.id}`)} className="gap-2">
                <InitialsAvatar name={p.name} className="size-6" />
                <span className="flex-1 truncate">{p.name}</span>
                {isSharedProject(p) && <UsersIcon className="size-3.5 text-muted-foreground" aria-label={de.sharing.shared} />}
                {p.id === project?.id && <CheckIcon className="size-4" />}
              </DropdownMenuItem>
            ))}
            {projects.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={() => setCreating(true)} className="gap-2">
              <div className="flex size-6 items-center justify-center rounded-md border">
                <PlusIcon className="size-4" />
              </div>
              {de.workspace.create}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      <CreateProjectDialog open={creating} onOpenChange={setCreating} />
    </SidebarMenu>
  )
}
