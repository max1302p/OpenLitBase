import { de } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { Label } from '@litbase/ui/components/label'
import { Switch } from '@litbase/ui/components/switch'
import { Cloud, Server } from 'lucide-react'
import { isCloud, settingsItem, type Settings } from '../../lib/settings'

interface SettingsViewProps {
  settings: Settings
  onChangeConnection: () => void
}

/** Verbindung (Cloud oder selbst gehostet) und Picker-Schalter. */
export function SettingsView({ settings, onChangeConnection }: SettingsViewProps) {
  const cloud = isCloud(settings.serverUrl)
  const Icon = cloud ? Cloud : Server
  return (
    <div className="grid gap-5 p-4">
      <div className="grid gap-2">
        <span className="text-xs font-medium text-muted-foreground">{de.extension.setup.connection}</span>
        <div className="flex items-center gap-3 rounded-xl border p-3">
          <Icon className="size-5 shrink-0 text-muted-foreground" />
          <div className="grid min-w-0 flex-1 text-sm">
            <span className="font-medium">{cloud ? de.extension.setup.cloud : de.extension.setup.selfHosted}</span>
            <span className="truncate text-xs text-muted-foreground">{settings.serverUrl.replace(/^https?:\/\//, '')}</span>
          </div>
        </div>
        <Button variant="outline" onClick={onChangeConnection}>
          {de.extension.setup.change}
        </Button>
      </div>
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="picker" className="font-normal">
          {de.extension.pickerEnabled}
        </Label>
        <Switch
          id="picker"
          checked={settings.pickerEnabled}
          onCheckedChange={(pickerEnabled) => void settingsItem.setValue({ ...settings, pickerEnabled })}
        />
      </div>
    </div>
  )
}
