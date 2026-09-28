import { de } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { Input } from '@litbase/ui/components/input'
import { CopyIcon, KeyRoundIcon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/lib/error-message'
import { useCreateToken } from './use-tokens'

/** Token anlegen; der Klartext wird genau einmal angezeigt. */
export function CreateTokenForm() {
  const [name, setName] = useState('')
  const [created, setCreated] = useState<string>()
  const createToken = useCreateToken()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    createToken.mutate(
      { name },
      {
        onSuccess: ({ token }) => {
          setCreated(token)
          setName('')
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  async function copy(token: string) {
    await navigator.clipboard.writeText(token)
    toast.success(de.tokens.copied)
  }

  return (
    <div className="grid gap-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={de.tokens.namePlaceholder} aria-label={de.tokens.nameLabel} />
        <Button type="submit" disabled={!name.trim() || createToken.isPending}>
          <KeyRoundIcon /> {de.tokens.create}
        </Button>
      </form>
      {created && (
        <div className="grid gap-2 rounded-md border border-primary/30 bg-accent p-3 text-sm">
          <p className="font-medium">{de.tokens.createdTitle}</p>
          <p className="text-muted-foreground">{de.tokens.createdDescription}</p>
          <div className="flex gap-2">
            <code className="min-w-0 flex-1 truncate rounded bg-background px-2 py-1.5 font-mono text-xs">{created}</code>
            <Button variant="outline" size="sm" onClick={() => void copy(created)}>
              <CopyIcon /> {de.tokens.copy}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
