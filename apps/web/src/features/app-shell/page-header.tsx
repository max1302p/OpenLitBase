import { de, isSharedProject } from '@litbase/shared'
import { Separator } from '@litbase/ui/components/separator'
import { SidebarTrigger } from '@litbase/ui/components/sidebar'
import { ChevronRightIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { PeopleStack } from '@/components/people-stack'
import { useActiveProject } from '../projects/use-projects'
import { ThemeToggle } from './theme-toggle'
import { UserMenu } from './user-menu'

interface PageHeaderProps {
  title: string
  /** Optionales Bild vor dem Titel. */
  icon?: ReactNode
  actions?: ReactNode
}

/** Fixierte Topbar: Seitenleiste, Pfad (Projekt › Seite), Seitenaktionen, Farbschema und Konto. */
export function PageHeader({ title, icon, actions }: PageHeaderProps) {
  const { projectId } = useParams()
  const { project } = useActiveProject()
  const inProject = projectId && project?.id === projectId

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/90 px-6 backdrop-blur lg:px-8 supports-backdrop-filter:bg-background/75">
      <SidebarTrigger className="-ml-1 shrink-0" aria-label={de.nav.toggleSidebar} />
      <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-center" />
      {inProject && (
        <>
          <Link
            to={`/projects/${project.id}`}
            className="hidden max-w-40 shrink-0 truncate text-sm text-muted-foreground hover:text-foreground sm:block"
          >
            {project.name}
          </Link>
          <ChevronRightIcon className="hidden size-4 shrink-0 text-muted-foreground sm:block" />
        </>
      )}
      {icon}
      {/* Der Titel kürzt sich – Aktionen, Farbschema und Konto bleiben immer sichtbar. */}
      <h1 className="min-w-0 truncate text-sm font-medium">{title}</h1>
      {inProject && isSharedProject(project) && <PeopleStack people={project.people} className="ml-2 hidden shrink-0 md:flex" />}
      <div className="ml-auto flex shrink-0 items-center gap-2 pl-2">
        {actions}
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  )
}
