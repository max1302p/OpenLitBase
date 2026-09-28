import type { ContentScriptContext } from 'wxt/utils/content-script-context'

/**
 * Ruft `callback` beim Laden und bei jedem Adresswechsel auf. Viele Datenbanken und Verlage laden
 * neue Seiten ohne Seitenwechsel (Single-Page-Apps) – deshalb wird die Adresse sekündlich geprüft.
 * Über `ctx` endet das automatisch, wenn die Extension neu geladen wird.
 */
export function onUrlChange(ctx: ContentScriptContext, callback: (href: string) => void) {
  let last = ''
  const check = () => {
    if (location.href === last) return
    last = location.href
    callback(last)
  }
  check()
  ctx.setInterval(check, 1000)
}
