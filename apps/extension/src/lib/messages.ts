import type { CslItem } from '@litbase/shared'
import { de } from '@litbase/shared/de'
import { browser } from 'wxt/browser'

/** Nachrichten an den Hintergrund – er macht alle API-Aufrufe. */
export type BackgroundMessage =
  | { type: 'add'; input: string }
  /** Katalogdaten ohne DOI/ISBN (z. B. swisscovery): Titel direkt anlegen. */
  | { type: 'addCsl'; csl: CslItem }

export type AddResponse = { ok: true; title: string; created: boolean } | { ok: false; error: string }

/**
 * Lehnt nie ab: auch sofort geworfene Fehler werden zur Meldung – etwa „Extension context
 * invalidated“, wenn die Extension neu geladen wurde und ein alter Tab noch das alte Skript hat.
 */
async function send(message: BackgroundMessage): Promise<AddResponse> {
  try {
    return (await browser.runtime.sendMessage(message)) as AddResponse
  } catch (error) {
    const invalidated = error instanceof Error && /context invalidated/i.test(error.message)
    return { ok: false, error: invalidated ? de.extension.reloadPage : de.extension.unreachable }
  }
}

export function addToProject(input: string) {
  return send({ type: 'add', input })
}

export function addCslToProject(csl: CslItem) {
  return send({ type: 'addCsl', csl })
}
