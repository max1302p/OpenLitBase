import { de } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { Input } from '@litbase/ui/components/input'
import { Label } from '@litbase/ui/components/label'
import { KeyRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { openInBrowser } from '../word/office'

interface ConnectFormProps {
  /** Ein Token wurde schon versucht und abgelehnt. */
  rejected: boolean
  onConnect: (token: string) => void
}

export function ConnectForm({ rejected, onConnect }: ConnectFormProps) {
  const [token, setToken] = useState('')

  function submit(event: FormEvent) {
    event.preventDefault()
    if (token.trim()) onConnect(token.trim())
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 p-4">
      <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        <KeyRound className="size-5" />
      </div>
      <div className="space-y-1">
        <h2 className="font-semibold">{de.addin.connectTitle}</h2>
        <p className="text-sm text-muted-foreground">{de.addin.connectDescription}</p>
      </div>
      <Button type="button" variant="outline" onClick={() => openInBrowser('/settings')}>
        {de.addin.openSettings}
      </Button>
      <div className="space-y-2">
        <Label htmlFor="token">{de.addin.tokenLabel}</Label>
        <Input
          id="token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder={de.addin.tokenPlaceholder}
          autoComplete="off"
          aria-invalid={rejected || undefined}
        />
        {rejected && <p className="text-sm text-destructive">{de.addin.invalidToken}</p>}
      </div>
      <Button type="submit" disabled={!token.trim()}>
        {de.addin.connect}
      </Button>
    </form>
  )
}
