import { de, type ApiClient, type Me } from '@litbase/shared'
import { AccountSummary } from '@litbase/ui/components/account-summary'
import { Button } from '@litbase/ui/components/button'
import { EmptyState } from '@litbase/ui/components/empty-state'
import { ProjectSelect } from '@litbase/ui/components/project-select'
import { ExternalLink, FolderPlus, Loader2 } from 'lucide-react'
import { browser } from 'wxt/browser'
import type { Settings } from '../../lib/settings'
import { RecentItems } from './recent-items'
import { useActiveProject } from './use-active-project'

interface MainViewProps {
  api: ApiClient
  settings: Settings
  me: Me
  isMulti: boolean
}

export function MainView({ api, settings, me, isMulti }: MainViewProps) {
  const { projects, projectId, select } = useActiveProject(api, settings.serverUrl)
  const openApp = () => void browser.tabs.create({ url: `${settings.serverUrl}/` })

  let body
  if (projects.isPending) {
    body = (
      <div className="flex h-24 items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    )
  } else if (!projects.data?.length) {
    body = (
      <EmptyState
        icon={FolderPlus}
        size="inline"
        title={de.addin.noProjectsTitle}
        description={de.addin.noProjectsDescription}
        action={<Button onClick={openApp}>{de.extension.openApp}</Button>}
      />
    )
  } else {
    body = (
      <>
        <div className="space-y-1.5">
          <ProjectSelect
            projects={projects.data}
            value={projectId}
            onChange={select}
            label={de.extension.project}
            placeholder={de.addin.projectPlaceholder}
          />
          <p className="text-xs text-muted-foreground">{de.extension.projectHint}</p>
        </div>
        <RecentItems serverUrl={settings.serverUrl} />
      </>
    )
  }

  return (
    <>
      <AccountSummary me={me} isMulti={isMulti} serverUrl={settings.serverUrl} />
      <div className="space-y-4 p-4">{body}</div>
      <footer className="border-t px-4 py-2">
        <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" onClick={openApp}>
          <ExternalLink />
          {de.extension.openApp}
        </Button>
      </footer>
    </>
  )
}
