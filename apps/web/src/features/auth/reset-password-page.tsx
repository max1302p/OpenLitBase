import { de } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { Input } from '@litbase/ui/components/input'
import { Label } from '@litbase/ui/components/label'
import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { authClient } from '@/lib/auth-client'
import { authErrorMessage } from './auth-error'
import { AuthLayout } from './auth-layout'

/** Ziel des Links aus der Reset-Mail: /reset-password?token=… (oder ?error=INVALID_TOKEN). */
export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState(
    searchParams.get('error') || !token ? authErrorMessage({ code: 'INVALID_TOKEN' }) : undefined,
  )

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!token) return
    const result = await authClient.resetPassword({ newPassword: password, token })
    if (result.error) setError(authErrorMessage(result.error))
    else setDone(true)
  }

  const backLink = (
    <Link to="/login" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
      {de.auth.backToLogin}
    </Link>
  )

  return (
    <AuthLayout title={de.auth.resetTitle} footer={backLink}>
      {done ? (
        <p className="text-sm">{de.auth.resetDone}</p>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="reset-password">{de.auth.newPassword}</Label>
            <Input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={de.auth.passwordHint}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={!token}>
            {de.auth.resetSubmit}
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
