import { de } from '@litbase/shared'
import { toast } from 'sonner'
import { ConfirmDialog } from '@litbase/ui/components/confirm-dialog'
import { errorMessage } from '@/lib/error-message'
import { useProjectMembership } from './use-items'

interface RemoveItemDialogProps {
  projectId: string
  itemId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onRemoved?: () => void
}

/** Titel aus dem Projekt entfernen (die API löscht ihn, wenn er sonst nirgends vorkommt). */
export function RemoveItemDialog({ projectId, itemId, open, onOpenChange, onRemoved }: RemoveItemDialogProps) {
  const { remove } = useProjectMembership()

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={de.items.removeConfirmTitle}
      description={de.items.removeConfirm}
      confirmLabel={de.items.remove}
      destructive
      onConfirm={() =>
        remove.mutate(
          { projectId, itemId },
          {
            onSuccess: () => {
              toast.success(de.items.removed)
              onRemoved?.()
            },
            onError: (error) => toast.error(errorMessage(error)),
          },
        )
      }
    />
  )
}
