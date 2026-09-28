import { de } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@litbase/ui/components/card'
import { ConfirmDialog } from '@litbase/ui/components/confirm-dialog'
import { Input } from '@litbase/ui/components/input'
import { Label } from '@litbase/ui/components/label'
import { useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'

/** Nur im Modus "multi": eigenes Konto endgültig löschen (Passwort + zweite Bestätigung). */
export function DeleteAccountCard() {
  const [password, setPassword] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string>()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(undefined)
    setConfirming(true)
  }

  async function deleteAccount() {
    setConfirming(false)
    setPending(true)
    try {
      await api.deleteAccount(password)
      queryClient.clear()
      toast.success(de.settings.deleted)
      void navigate('/login', { replace: true })
    } catch (e) {
      setError(errorMessage(e))
      setPending(false)
    }
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-destructive">{de.settings.deleteTitle}</CardTitle>
        <CardDescription>{de.settings.deleteDescription}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
          {de.settings.deleteRemoves.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="text-muted-foreground text-sm">{de.settings.deleteKeeps}</p>
        <p className="text-muted-foreground text-sm">{de.settings.deleteExportHint}</p>
        <form onSubmit={handleSubmit} className="grid max-w-md gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="delete-password">{de.settings.deletePassword}</Label>
            <Input
              id="delete-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div>
            <Button type="submit" variant="destructive" disabled={pending || !password}>
              {de.settings.deleteSubmit}
            </Button>
          </div>
        </form>
        <ConfirmDialog
          open={confirming}
          onOpenChange={setConfirming}
          title={de.settings.deleteConfirmTitle}
          description={de.settings.deleteConfirmText}
          confirmLabel={de.settings.deleteConfirm}
          onConfirm={() => void deleteAccount()}
          destructive
        />
      </CardContent>
    </Card>
  )
}
