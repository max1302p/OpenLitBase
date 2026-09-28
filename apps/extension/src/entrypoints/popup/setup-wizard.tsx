import { ApiError, de } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { Input } from '@litbase/ui/components/input'
import { Label } from '@litbase/ui/components/label'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Cloud, ExternalLink, Loader2, Server } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { browser } from 'wxt/browser'
import { apiFor } from '../../lib/api'
import { CLOUD_URL, DEFAULT_SERVER_URL, isCloud, normalizeServerUrl, settingsItem, type Settings } from '../../lib/settings'
import { ChoiceCard } from './choice-card'

type Step = 'mode' | 'server' | 'token'

interface SetupWizardProps {
  settings: Settings
  /** Server erreichbar, aber Anmeldung fehlt → direkt beim Token beginnen. */
  startWithToken: boolean
  onDone: () => void
  /** Nur beim Ändern einer bestehenden Verbindung. */
  onCancel?: () => void
}

/** Einrichtung in höchstens drei Schritten: Cloud oder selbst gehostet → Adresse → Token (nur mit Login). */
export function SetupWizard({ settings, startWithToken, onDone, onCancel }: SetupWizardProps) {
  const t = de.extension.setup
  const [step, setStep] = useState<Step>(startWithToken ? 'token' : 'mode')
  const [serverUrl, setServerUrl] = useState(isCloud(settings.serverUrl) ? DEFAULT_SERVER_URL : settings.serverUrl)
  const [target, setTarget] = useState(settings.serverUrl)
  const [token, setToken] = useState('')
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState(false)
  const queryClient = useQueryClient()

  async function save(url: string, apiToken: string) {
    await settingsItem.setValue({ ...settings, serverUrl: url, token: apiToken })
    await queryClient.invalidateQueries()
    onDone()
  }

  /** Server prüfen: ohne Login fertig, mit Login weiter zum Token. */
  async function connect(url: string) {
    const normalized = normalizeServerUrl(url)
    setTarget(normalized)
    setError(undefined)
    setPending(true)
    try {
      const config = await apiFor({ serverUrl: normalized, token: '' }).getConfig()
      if (config.authMode === 'multi') setStep('token')
      else await save(normalized, '')
    } catch {
      setError(de.extension.unreachable)
    } finally {
      setPending(false)
    }
  }

  async function verifyToken(event: FormEvent) {
    event.preventDefault()
    setError(undefined)
    setPending(true)
    try {
      await apiFor({ serverUrl: target, token: token.trim() }).getMe()
      await save(target, token.trim())
    } catch (e) {
      setError(e instanceof ApiError && e.status === 401 ? t.invalidToken : e instanceof ApiError ? e.message : de.extension.unreachable)
    } finally {
      setPending(false)
    }
  }

  const back = (to: Step) => (
    <Button type="button" variant="ghost" size="sm" className="-ml-2 w-fit" onClick={() => (setError(undefined), setStep(to))}>
      <ArrowLeft /> {t.back}
    </Button>
  )
  const errorLine = error && <p className="text-sm text-destructive">{error}</p>

  if (step === 'mode') {
    return (
      <div className="grid gap-4 p-4">
        <div className="grid gap-1">
          <h2 className="font-semibold">{t.title}</h2>
          <p className="text-sm text-muted-foreground">{t.description}</p>
        </div>
        <ChoiceCard icon={Cloud} title={t.cloud} description={t.cloudHint} pending={pending && target === CLOUD_URL} onClick={() => void connect(CLOUD_URL)} />
        <ChoiceCard icon={Server} title={t.selfHosted} description={t.selfHostedHint} onClick={() => (setError(undefined), setStep('server'))} />
        {errorLine}
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            {de.common.cancel}
          </Button>
        )}
      </div>
    )
  }

  if (step === 'server') {
    return (
      <form className="grid gap-4 p-4" onSubmit={(e) => (e.preventDefault(), void connect(serverUrl))}>
        {back('mode')}
        <h2 className="font-semibold">{t.serverTitle}</h2>
        <div className="grid gap-1.5">
          <Label htmlFor="server">{t.serverLabel}</Label>
          <Input id="server" type="url" required autoFocus value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} />
          <p className="text-xs text-muted-foreground">{t.serverHint}</p>
        </div>
        {errorLine}
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          {pending ? t.connecting : t.connect}
        </Button>
      </form>
    )
  }

  return (
    <form className="grid gap-4 p-4" onSubmit={(e) => void verifyToken(e)}>
      {back(isCloud(target) ? 'mode' : 'server')}
      <div className="grid gap-1">
        <h2 className="font-semibold">{t.tokenTitle}</h2>
        <p className="text-sm text-muted-foreground">{t.tokenHint(target.replace(/^https?:\/\//, ''))}</p>
      </div>
      <Button type="button" variant="outline" onClick={() => void browser.tabs.create({ url: `${target}/settings` })}>
        <ExternalLink /> {t.openTokens}
      </Button>
      <div className="grid gap-1.5">
        <Label htmlFor="token">{t.tokenLabel}</Label>
        <Input id="token" required autoFocus value={token} placeholder="olb_…" autoComplete="off" onChange={(e) => setToken(e.target.value)} />
      </div>
      {errorLine}
      <Button type="submit" disabled={pending || !token.trim()}>
        {pending && <Loader2 className="animate-spin" />}
        {pending ? t.connecting : t.connect}
      </Button>
    </form>
  )
}
