import { de } from '@litbase/shared'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@litbase/ui/components/dialog'
import { Separator } from '@litbase/ui/components/separator'
import { Loader2Icon } from 'lucide-react'
import { InviteForm } from './invite-form'
import { MemberList } from './member-list'
import { useMembers } from './use-members'

interface ShareDialogProps {
  projectId: string
  isOwner: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShareDialog({ projectId, isOwner, open, onOpenChange }: ShareDialogProps) {
  const members = useMembers(projectId, open)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{de.sharing.title}</DialogTitle>
          <DialogDescription>{isOwner ? de.sharing.description : de.sharing.viewDescription}</DialogDescription>
        </DialogHeader>
        {isOwner && (
          <>
            <InviteForm projectId={projectId} />
            <Separator />
          </>
        )}
        {members.data ? (
          <MemberList projectId={projectId} data={members.data} isOwner={isOwner} />
        ) : (
          <div className="flex justify-center py-6 text-muted-foreground">
            <Loader2Icon className="size-5 animate-spin" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
