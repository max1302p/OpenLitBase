import { de } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { Input } from '@litbase/ui/components/input'
import { Label } from '@litbase/ui/components/label'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { authClient, RESET_REDIRECT } from '@/lib/auth-client'
import { authErrorMessage } from './auth-error'
import { AuthLayout } from './auth-layout'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string>()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const result = await authClient.requestPasswordReset({ email, redirectTo: RESET_REDIRECT })
    if (result.error) setError(authErrorMessage(result.error))
    else setSent(true)
  }

  const backLink = (
    <Link to="/login" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
      {de.auth.backToLogin}
    </Link>
  )

  return (
    <AuthLayout title={de.auth.forgotTitle} description={de.auth.forgotDescription} footer={backLink}>
      {sent ? (
        <p className="text-sm">{de.auth.forgotSent}</p>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="forgot-email">{de.auth.email}</Label>
            <Input id="forgot-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit">{de.auth.forgotSubmit}</Button>
        </form>
      )}
    </AuthLayout>
  )
}
