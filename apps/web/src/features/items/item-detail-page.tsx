import { de, itemTitle } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { ArrowLeftIcon, FileQuestionIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { EmptyState } from '@litbase/ui/components/empty-state'
import { PageBody } from '../app-shell/page-body'
import { PageHeader } from '../app-shell/page-header'
import { useProjectPermissions } from '../projects/use-permissions'
import { ItemAttachmentsCard } from './item-attachments-card'
import { ItemMetadataCard } from './item-metadata-card'
import { ItemProtocolCard } from '../protocol/item-protocol-card'
import { ItemNotesCard } from './item-notes-card'
import { ItemPreviewCard } from './item-preview-card'
import { RemoveItemDialog } from './remove-item-dialog'
import { useItem } from './use-items'

export function ItemDetailPage() {
  const { itemId = '', projectId = '' } = useParams()
  const navigate = useNavigate()
  const item = useItem(itemId)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { canEdit } = useProjectPermissions()

  const actions = (
    <>
      <Button variant="ghost" onClick={() => void navigate(`/projects/${projectId}/items`)}>
        <ArrowLeftIcon /> {de.items.back}
      </Button>
      {canEdit && (
        <Button variant="ghost" size="icon" aria-label={de.items.remove} onClick={() => setConfirmDelete(true)}>
          <Trash2Icon />
        </Button>
      )}
    </>
  )

  if (!item.data) {
    return (
      <>
        <PageHeader title={item.isPending ? de.common.loading : de.empty.itemNotFoundTitle} />
        {!item.isPending && (
          <PageBody>
            <EmptyState
              icon={FileQuestionIcon}
              title={de.empty.itemNotFoundTitle}
              description={de.empty.itemNotFoundDescription}
              action={
                <Button onClick={() => void navigate(`/projects/${projectId}/items`)}>
                  <ArrowLeftIcon /> {de.empty.toItems}
                </Button>
              }
            />
          </PageBody>
        )}
      </>
    )
  }

  return (
    <>
      <PageHeader title={itemTitle(item.data.csl)} actions={actions} />
      <PageBody className="grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-6">
          <ItemMetadataCard key={item.data.id} item={item.data} />
          <ItemProtocolCard key={`protocol-${item.data.id}`} projectId={projectId} itemId={item.data.id} />
        </div>
        <div className="flex flex-col gap-6">
          <ItemPreviewCard itemId={item.data.id} projectId={projectId} />
          <ItemNotesCard key={item.data.id} item={item.data} />
          <ItemAttachmentsCard item={item.data} />
        </div>
      </PageBody>
      <RemoveItemDialog
        projectId={projectId}
        itemId={item.data.id}
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        onRemoved={() => void navigate(`/projects/${projectId}/items`, { replace: true })}
      />
    </>
  )
}
