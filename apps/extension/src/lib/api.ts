import { createApiClient } from '@litbase/shared'
import { settingsItem, type Settings } from './settings'

/** API-Client mit Server-URL und Token aus den Einstellungen; ohne Cookies (siehe CORS). */
export function apiFor(settings: Pick<Settings, 'serverUrl' | 'token'>) {
  return createApiClient({ baseUrl: settings.serverUrl, token: settings.token || undefined, credentials: 'omit' })
}

export async function getApi() {
  return apiFor(await settingsItem.getValue())
}
