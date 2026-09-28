import { ApiError, de } from '@litbase/shared'
import { BrandLogo } from '@litbase/ui/components/brand-logo'
import { Button } from '@litbase/ui/components/button'
import { Loader2 } from 'lucide-react'
import { errorMessage } from '../lib/error-message'
import { isWord } from '../word/office'
import { AccountBar } from './account-bar'
import { CitePanel } from './cite-panel'
import { ConnectForm } from './connect-form'
import { useConnection } from './use-connection'

export function Taskpane() {
  const { api, token, me, isMulti, unauthorized, connect } = useConnection()

  let content
  if (me.isPending) {
    content = (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    )
  } else if (unauthorized) {
    content = <ConnectForm rejected={Boolean(token)} onConnect={connect} />
  } else if (me.isError) {
    const blocked = me.error instanceof ApiError && me.error.status === 403
    content = (
      <div className="flex flex-col gap-3 p-4 text-sm">
        <p className="text-destructive">{errorMessage(me.error)}</p>
        {!blocked && (
          <Button variant="outline" onClick={() => me.refetch()}>
            {de.common.retry}
          </Button>
        )}
      </div>
    )
  } else {
    content = <CitePanel api={api} />
  }

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex h-12 shrink-0 items-center justify-center border-b px-4">
        <BrandLogo className="h-5" />
      </header>
      {me.data && <AccountBar me={me.data} isMulti={isMulti} onDisconnect={token ? () => connect(undefined) : undefined} />}
      {!isWord() && (
        <p className="border-b bg-muted px-4 py-2 text-xs text-muted-foreground">{de.addin.notInWord}</p>
      )}
      {content}
    </div>
  )
}
