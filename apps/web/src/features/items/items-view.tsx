import { de } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { Input } from '@litbase/ui/components/input'
import { LibraryBigIcon, PlusIcon, SearchIcon } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '@litbase/ui/components/empty-state'
import { AddItemDialog } from './add-item/add-item-dialog'
import { ExportMenu } from './export-menu'
import { ItemsTable } from './items-table'
import { useProjectPermissions } from '../projects/use-permissions'
import { useItems } from './use-items'

/** Titel eines Projekts: oben Suche, Export und „Titel hinzufügen“; ohne Titel ein Einstieg. */
export function ItemsView({ projectId }: { projectId: string }) {
  const items = useItems(projectId)
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const { canEdit } = useProjectPermissions()
  const list = items.data ?? []
  const addButton = canEdit && (
    <Button onClick={() => setAdding(true)}>
      <PlusIcon /> {de.addItem.button}
    </Button>
  )

  return (
    <>
      {items.isSuccess && list.length === 0 ? (
        <EmptyState icon={LibraryBigIcon} title={de.items.emptyTitle} description={de.items.emptyDescription} action={addButton} />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-56 flex-1 sm:max-w-md">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={de.common.search} className="pl-9" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <ExportMenu projectId={projectId} />
              {addButton}
            </div>
          </div>
          <ItemsTable
            items={list}
            projectId={projectId}
            loading={items.isPending}
            search={search}
            onClearSearch={() => setSearch('')}
          />
        </div>
      )}
      {/* Eine Instanz für beide Zustände – bleibt offen, wenn aus „leer“ eine Liste wird. */}
      <AddItemDialog projectId={projectId} open={adding} onOpenChange={setAdding} />
    </>
  )
}


