import { de, type ProjectMember, type ProjectMembers } from '@litbase/shared'
import { Badge } from '@litbase/ui/components/badge'
import { Button } from '@litbase/ui/components/button'
import { ConfirmDialog } from '@litbase/ui/components/confirm-dialog'
import { UserAvatar } from '@litbase/ui/components/user-avatar'
import { MailIcon, XIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/lib/error-message'
import { useMe } from '../auth/use-session'
import { RoleSelect } from './role-select'
import { useRemoveMember, useUpdateMember } from './use-members'

interface MemberListProps {
  projectId: string
  data: ProjectMembers
  isOwner: boolean
}

function Person({ userId, name, email, children }: { userId: string | null; name: string | null; email: string; children?: ReactNode }) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      {userId ? (
        <UserAvatar userId={userId} name={name ?? email} className="size-8 rounded-full" />
      ) : (
        <span className="flex size-8 items-center justify-center rounded-full border border-dashed text-muted-foreground">
          <MailIcon className="size-4" />
        </span>
      )}
      <div className="grid min-w-0 flex-1 text-sm leading-tight">
        <span className="truncate font-medium">{name ?? email}</span>
        {name && <span className="truncate text-xs text-muted-foreground">{email}</span>}
      </div>
      {children}
    </li>
  )
}

/** Besitzer:in und Mitglieder; Besitzer:in ändert Rechte und entfernt, alle anderen können gehen. */
export function MemberList({ projectId, data, isOwner }: MemberListProps) {
  const me = useMe().data
  const navigate = useNavigate()
  const update = useUpdateMember(projectId)
  const remove = useRemoveMember(projectId)
  const [confirm, setConfirm] = useState<ProjectMember>()
  const leaving = confirm?.userId === me?.id

  function removeConfirmed() {
    if (!confirm) return
    remove.mutate(confirm.id, {
      onSuccess: () => {
        toast.success(leaving ? de.sharing.left : de.sharing.removed)
        if (leaving) void navigate('/', { replace: true })
      },
      onError: (e) => toast.error(errorMessage(e)),
    })
  }

  return (
    <>
      <ul className="divide-y">
        <Person userId={data.owner.userId} name={data.owner.name} email={data.owner.email}>
          <span className="text-xs text-muted-foreground">
            {de.sharing.roles.owner}
            {data.owner.userId === me?.id && ` (${de.sharing.you})`}
          </span>
        </Person>
        {data.members.map((member) => (
          <Person key={member.id} userId={member.userId} name={member.name} email={member.email}>
            {!member.userId && <Badge variant="outline">{de.sharing.pending}</Badge>}
            {isOwner ? (
              <RoleSelect
                value={member.role}
                onChange={(role) =>
                  update.mutate({ memberId: member.id, role }, { onSuccess: () => toast.success(de.sharing.roleChanged) })
                }
              />
            ) : (
              <span className="text-xs text-muted-foreground">
                {de.sharing.roles[member.role]}
                {member.userId === me?.id && ` (${de.sharing.you})`}
              </span>
            )}
            {(isOwner || member.userId === me?.id) && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground"
                aria-label={member.userId === me?.id ? de.sharing.leave : de.sharing.remove}
                onClick={() => setConfirm(member)}
              >
                <XIcon />
              </Button>
            )}
          </Person>
        ))}
      </ul>
      <ConfirmDialog
        open={Boolean(confirm)}
        onOpenChange={(open) => !open && setConfirm(undefined)}
        title={leaving ? de.sharing.leaveTitle : de.sharing.removeTitle}
        description={leaving ? de.sharing.leaveDescription : de.sharing.removeDescription(confirm?.name ?? confirm?.email ?? '')}
        confirmLabel={leaving ? de.sharing.leave : de.sharing.remove}
        destructive
        onConfirm={removeConfirmed}
      />
    </>
  )
}
