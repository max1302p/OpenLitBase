import { de, type MemberRole } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { Input } from '@litbase/ui/components/input'
import { UserPlusIcon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/lib/error-message'
import { RoleSelect } from './role-select'
import { useInviteMember } from './use-members'

export function InviteForm({ projectId }: { projectId: string }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<MemberRole>('editor')
  const [error, setError] = useState<string>()
  const invite = useInviteMember(projectId)

  function submit(event: FormEvent) {
    event.preventDefault()
    invite.mutate(
      { email, role },
      {
        onSuccess: ({ mailSent }) => {
          if (mailSent) toast.success(de.sharing.invited(email))
          else toast.warning(de.sharing.inviteMailFailed)
          setEmail('')
          setError(undefined)
        },
        onError: (e) => setError(errorMessage(e)),
      },
    )
  }

  return (
    <form onSubmit={submit} className="grid gap-2">
      <div className="flex gap-2">
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={de.sharing.emailPlaceholder}
          aria-label={de.sharing.email}
          aria-invalid={Boolean(error) || undefined}
          className="h-9 flex-1"
        />
        <RoleSelect value={role} onChange={setRole} />
        <Button type="submit" disabled={invite.isPending}>
          <UserPlusIcon /> {de.sharing.invite}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  )
}
