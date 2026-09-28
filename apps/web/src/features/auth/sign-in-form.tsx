import { de } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { Input } from '@litbase/ui/components/input'
import { Label } from '@litbase/ui/components/label'
import { useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { authClient, VERIFY_CALLBACK } from '@/lib/auth-client'
import { nextPath } from '@/lib/next-path'
import { authErrorMessage } from './auth-error'

export function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string>()
  const [unverified, setUnverified] = useState(false)
  const [pending, setPending] = useState(false)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    const result = await authClient.signIn.email({ email, password })
    setPending(false)
    if (result.error) {
      setError(authErrorMessage(result.error))
      setUnverified(result.error.code === 'EMAIL_NOT_VERIFIED')
      return
    }
    await queryClient.invalidateQueries()
    void navigate(nextPath(searchParams.get('next')), { replace: true })
  }

  async function resendVerification() {
    const result = await authClient.sendVerificationEmail({ email, callbackURL: VERIFY_CALLBACK })
    if (result.error) toast.error(authErrorMessage(result.error))
    else toast.success(de.auth.verificationSent)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="signin-email">{de.auth.email}</Label>
        <Input id="signin-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="grid gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="signin-password">{de.auth.password}</Label>
          <Link to="/forgot-password" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
            {de.auth.forgotPassword}
          </Link>
        </div>
        <Input
          id="signin-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {unverified && (
        <Button type="button" variant="outline" onClick={() => void resendVerification()}>
          {de.auth.resendVerification}
        </Button>
      )}
      <Button type="submit" disabled={pending}>
        {de.auth.signInSubmit}
      </Button>
    </form>
  )
}
