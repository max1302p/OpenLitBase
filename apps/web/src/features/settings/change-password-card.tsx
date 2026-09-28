import { de } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@litbase/ui/components/card'
import { Input } from '@litbase/ui/components/input'
import { Label } from '@litbase/ui/components/label'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import { authErrorMessage } from '../auth/auth-error'

const empty = { current: '', next: '', confirm: '' }

/** Nur im Modus "multi": Passwort ändern, andere Sitzungen werden beendet. */
export function ChangePasswordCard() {
  const [values, setValues] = useState(empty)
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState(false)
  const set = (key: keyof typeof empty) => (e: { target: { value: string } }) => setValues({ ...values, [key]: e.target.value })

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (values.next !== values.confirm) return setError(de.settings.passwordMismatch)
    setPending(true)
    const result = await authClient.changePassword({
      currentPassword: values.current,
      newPassword: values.next,
      revokeOtherSessions: true,
    })
    setPending(false)
    if (result.error) return setError(authErrorMessage(result.error))
    setError(undefined)
    setValues(empty)
    toast.success(de.settings.passwordChanged)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{de.settings.passwordTitle}</CardTitle>
        <CardDescription>{de.settings.passwordDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid max-w-md gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="current-password">{de.settings.currentPassword}</Label>
            <Input id="current-password" type="password" autoComplete="current-password" required value={values.current} onChange={set('current')} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="new-password">{de.settings.newPassword}</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              placeholder={de.auth.passwordHint}
              value={values.next}
              onChange={set('next')}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="confirm-password">{de.settings.confirmPassword}</Label>
            <Input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={values.confirm} onChange={set('confirm')} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div>
            <Button type="submit" disabled={pending}>
              {de.settings.passwordSubmit}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
