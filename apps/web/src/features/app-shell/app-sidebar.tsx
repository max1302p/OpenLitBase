import { de } from '@litbase/shared'
import { BrandLogo } from '@litbase/ui/components/brand-logo'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarRail,
} from '@litbase/ui/components/sidebar'
import { BookOpenTextIcon, LayoutDashboardIcon, LibraryBigIcon, ListChecksIcon, Settings2Icon, TableIcon } from 'lucide-react'
import { NavLink } from 'react-router'
import { useProjectPermissions } from '../projects/use-permissions'
import { useActiveProject } from '../projects/use-projects'
import { WorkspaceSwitcher } from '../projects/workspace-switcher'
import { NavLinkButton } from './nav-link-button'

/** Seitenleiste: Logo, Projekt-Umschalter und die Bereiche des aktiven Projekts. */
export function AppSidebar() {
  const { project } = useActiveProject()
  const base = project && `/projects/${project.id}`
  const { isOwner } = useProjectPermissions()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3">
        <NavLink to="/" className="flex w-full items-center justify-center py-3" aria-label={de.appName}>
          <span className="group-data-[collapsible=icon]:hidden">
            <BrandLogo className="h-5" alt={de.appName} />
          </span>
          <span className="hidden group-data-[collapsible=icon]:block">
            <BrandLogo markOnly className="size-5" alt={de.appName} />
          </span>
        </NavLink>
        <WorkspaceSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {base && (
          <SidebarGroup>
            <SidebarGroupLabel>{de.nav.project}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <NavLinkButton to={base} end label={de.nav.overview} icon={LayoutDashboardIcon} />
                <NavLinkButton to={`${base}/items`} label={de.nav.items} icon={LibraryBigIcon} />
                <NavLinkButton to={`${base}/bibliography`} label={de.nav.bibliography} icon={BookOpenTextIcon} />
                <NavLinkButton to={`${base}/protocol`} label={de.nav.protocol} icon={ListChecksIcon} />
                <NavLinkButton to={`${base}/matrix`} label={de.nav.termMatrix} icon={TableIcon} />
                {isOwner && <NavLinkButton to={`${base}/settings`} label={de.nav.projectSettings} icon={Settings2Icon} />}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
