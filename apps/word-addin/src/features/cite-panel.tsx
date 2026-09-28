import { de, type ApiClient } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { ConfirmDialog } from '@litbase/ui/components/confirm-dialog'
import { EmptyState } from '@litbase/ui/components/empty-state'
import { cn } from '@litbase/ui/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { FolderPlus, ListOrdered, Loader2, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { errorMessage } from '../lib/error-message'
import { isWord, openInBrowser } from '../word/office'
import { ItemList } from './item-list'
import { ProjectSelect } from '@litbase/ui/components/project-select'
import { ToolbarButton } from './toolbar-button'
import { useDocumentActions } from './use-document-actions'
import { useProjectSelection } from './use-project-selection'

const spinner = (
  <div className="flex flex-1 items-center justify-center text-muted-foreground">
    <Loader2 className="size-5 animate-spin" />
  </div>
)

export function CitePanel({ api }: { api: ApiClient }) {
  const { projects, projectId, select } = useProjectSelection(api)
  const items = useQuery({
    queryKey: ['items', projectId],
    queryFn: () => api.listItems(projectId),
    enabled: Boolean(projectId),
  })
  const actions = useDocumentActions(api, projectId)
  const [confirmBibliography, setConfirmBibliography] = useState(false)
  const disabled = !isWord() || !projectId || actions.busy

  if (projects.isPending) return spinner
  if (projects.isError) return <p className="p-4 text-sm text-destructive">{errorMessage(projects.error)}</p>
  if (projects.data.length === 0) {
    return (
      <EmptyState
        icon={FolderPlus}
        className="m-4"
        title={de.addin.noProjectsTitle}
        description={de.addin.noProjectsDescription}
        action={<Button onClick={() => openInBrowser('/')}>{de.addin.openApp}</Button>}
      />
    )
  }

  function insert(itemId: string, locator: string | undefined) {
    actions.cite.mutate({ items: [{ id: itemId, ...(locator && { locator }) }] })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
      <div className="flex items-end gap-0.5">
        <div className="min-w-0 flex-1">
          <ProjectSelect
            projects={projects.data}
            value={projectId}
            onChange={select}
            label={de.addin.project}
            placeholder={de.addin.projectPlaceholder}
          />
        </div>
        <ToolbarButton label={de.addin.refresh} disabled={disabled} onClick={() => actions.refresh.mutate()}>
          <RefreshCw className={cn(actions.refresh.isPending && 'animate-spin')} />
        </ToolbarButton>
        <ToolbarButton label={de.addin.insertBibliography} disabled={disabled} onClick={() => setConfirmBibliography(true)}>
          {actions.bibliography.isPending ? <Loader2 className="animate-spin" /> : <ListOrdered />}
        </ToolbarButton>
      </div>
      {items.isPending ? (
        spinner
      ) : items.isError ? (
        <p className="text-sm text-destructive">{errorMessage(items.error)}</p>
      ) : (
        <ItemList
          items={items.data}
          disabled={disabled}
          pendingId={actions.cite.isPending ? actions.cite.variables.items[0]?.id : undefined}
          onInsert={insert}
        />
      )}
      <ConfirmDialog
        open={confirmBibliography}
        onOpenChange={setConfirmBibliography}
        title={de.addin.insertBibliographyTitle}
        description={de.addin.insertBibliographyDescription}
        confirmLabel={de.addin.insertBibliographyConfirm}
        onConfirm={() => actions.bibliography.mutate()}
      />
    </div>
  )
}
