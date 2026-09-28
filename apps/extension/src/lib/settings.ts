import { storage } from 'wxt/utils/storage'

/** Gehostete Version. */
export const CLOUD_URL = 'https://cloud.openlitbase.de'
/** Selbst gehostet auf diesem Rechner: Port 1450 (Buchdruck). */
export const DEFAULT_SERVER_URL = 'http://localhost:1450'

export const isCloud = (serverUrl: string) => serverUrl.replace(/\/+$/, '') === CLOUD_URL

export interface Settings {
  serverUrl: string
  /** Persönlicher API-Token (nur im Modus `multi` nötig). */
  token: string
  /** Picker-Symbole und Übernehmen-Symbol auf Webseiten anzeigen. */
  pickerEnabled: boolean
}

export const settingsItem = storage.defineItem<Settings>('local:settings', {
  fallback: { serverUrl: DEFAULT_SERVER_URL, token: '', pickerEnabled: true },
})

/** Aktives Projekt: dorthin gehen Picker und Übernehmen-Symbol. */
export const projectItem = storage.defineItem<string | null>('local:projectId', { fallback: null })

export interface RecentItem {
  id: string
  projectId: string
  title: string
  meta: string
  addedAt: number
}

export const recentItems = storage.defineItem<RecentItem[]>('local:recentItems', { fallback: [] })

/** Server-URL ohne Schrägstrich am Ende. */
export function normalizeServerUrl(url: string) {
  return url.trim().replace(/\/+$/, '')
}
