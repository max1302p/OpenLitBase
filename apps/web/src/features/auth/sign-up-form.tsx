import { de } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { Checkbox } from '@litbase/ui/components/checkbox'
import { Input } from '@litbase/ui/components/input'
import { Label } from '@litbase/ui/components/label'
import { MailCheckIcon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { authClient, VERIFY_CALLBACK } from '@/lib/auth-client'
import { authErrorMessage } from './auth-error'
import { useConfig } from './use-session'

export function SignUpForm() {
  const [name, setName] = useState('')
  // Aus dem Einladungslink (…/login?mode=signup&email=…).
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string>()
  const [sentTo, setSentTo] = useState<string>()
  const [pending, setPending] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const legal = useConfig().data?.legal
  // Zustimmung nur, wenn die Betreiberin Rechtstexte hinterlegt hat (LEGAL_* in der API).
  const needsConsent = Boolean(legal?.termsUrl || legal?.privacyUrl)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (needsConsent && !accepted) return setError(de.auth.consentRequired)
    setPending(true)
    const input = { name, email, password, callbackURL: VERIFY_CALLBACK, ...(needsConsent && { acceptTerms: true }) }
    const result = await authClient.signUp.email(input as Parameters<typeof authClient.signUp.email>[0])
    setPending(false)
    if (result.error) setError(authErrorMessage(result.error))
    else setSentTo(email)
  }

  if (sentTo) {
    return (
      <div className="flex gap-3 rounded-md bg-accent p-4 text-sm text-accent-foreground">
        <MailCheckIcon className="size-5 shrink-0" />
        <p>{de.auth.checkInbox(sentTo)}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="signup-name">{de.auth.name}</Label>
        <Input
          id="signup-name"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={de.auth.namePlaceholder}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="signup-email">{de.auth.email}</Label>
        <Input id="signup-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="signup-password">{de.auth.password}</Label>
        <Input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={de.auth.passwordHint}
        />
      </div>
      {needsConsent && (
        <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
          <Checkbox className="mt-0.5" checked={accepted} onCheckedChange={(v) => setAccepted(v === true)} required />
          <span>
            <ConsentText termsUrl={legal?.termsUrl ?? null} privacyUrl={legal?.privacyUrl ?? null} />
          </span>
        </label>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending || (needsConsent && !accepted)}>
        {de.auth.signUpSubmit}
      </Button>
    </form>
  )
}

const linkClass = 'text-foreground underline underline-offset-4'

/** „Ich akzeptiere die Nutzungsbedingungen und habe die Datenschutzerklärung zur Kenntnis genommen.“ */
function ConsentText({ termsUrl, privacyUrl }: { termsUrl: string | null; privacyUrl: string | null }) {
  const terms = termsUrl && (
    <a href={termsUrl} target="_blank" rel="noopener" className={linkClass}>
      {de.auth.consentTermsLink}
    </a>
  )
  const privacy = privacyUrl && (
    <a href={privacyUrl} target="_blank" rel="noopener" className={linkClass}>
      {de.auth.consentPrivacyLink}
    </a>
  )
  if (terms && privacy)
    return (
      <>
        {de.auth.consentBefore}
        {terms}
        {de.auth.consentAnd}
        {privacy}
        {de.auth.consentAfter}
      </>
    )
  if (terms)
    return (
      <>
        {de.auth.consentTermsOnly}
        {terms}.
      </>
    )
  return (
    <>
      {de.auth.consentPrivacyOnly}
      {privacy}
      {de.auth.consentAfter}
    </>
  )
}
