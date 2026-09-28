import { ApiError, de } from '@litbase/shared'
import { BrandLogo } from '@litbase/ui/components/brand-logo'
import { Button } from '@litbase/ui/components/button'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Loader2, Settings } from 'lucide-react'
import { useMemo, useState } from 'react'
import { apiFor } from '../../lib/api'
import { settingsItem, type Settings as ExtensionSettings } from '../../lib/settings'
import { MainView } from './main-view'
import { SettingsView } from './settings-view'
import { SetupWizard } from './setup-wizard'
import { useStorageItem } from './use-storage-item'

type View = 'main' | 'settings' | 'setup'

function Popup({ settings }: { settings: ExtensionSettings }) {
  const [view, setView] = useState<View>('main')
  const api = useMemo(() => apiFor(settings), [settings])
  const connection = [settings.serverUrl, settings.token]
  const config = useQuery({ queryKey: ['config', ...connection], queryFn: api.getConfig })
  const me = useQuery({ queryKey: ['me', ...connection], queryFn: api.getMe })
  // Ohne Verbindung führt der Assistent durch die Einrichtung.
  const needsSetup = me.isError || view === 'setup'

  let content
  if (me.isPending) {
    content = (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    )
  } else if (needsSetup) {
    content = (
      <SetupWizard
        settings={settings}
        startWithToken={me.error instanceof ApiError && me.error.status === 401}
        onDone={() => setView('main')}
        onCancel={me.isError ? undefined : () => setView('settings')}
      />
    )
  } else if (view === 'settings') {
    content = <SettingsView settings={settings} onChangeConnection={() => setView('setup')} />
  } else {
    content = <MainView api={api} settings={settings} me={me.data!} isMulti={config.data?.authMode === 'multi'} />
  }

  return (
    <div className="w-[360px] bg-background text-foreground">
      <header className="relative flex h-12 items-center justify-center border-b px-4">
        <BrandLogo className="h-5" />
        {!me.isPending && !needsSetup && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2"
            aria-label={view === 'settings' ? de.extension.back : de.extension.settings}
            onClick={() => setView(view === 'settings' ? 'main' : 'settings')}
          >
            {view === 'settings' ? <ArrowLeft /> : <Settings />}
          </Button>
        )}
      </header>
      {content}
    </div>
  )
}

export function App() {
  const settings = useStorageItem(settingsItem)
  return settings ? <Popup settings={settings} /> : null
}
