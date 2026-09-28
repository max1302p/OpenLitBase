import { detectPageWork } from '@litbase/shared/identifiers'
import { de } from '@litbase/shared/de'
import type { ContentScriptContext } from 'wxt/utils/content-script-context'
import { defineContentScript } from 'wxt/utils/define-content-script'
import { addCslToProject, addToProject } from '../../lib/messages'
import { fetchPnx, pnxToWork, primoRecordFromUrl } from '../../lib/primo'
import { settingsItem } from '../../lib/settings'
import { createIsland, type IslandWork } from './island'
import { createPickerScanner, type PickHandler } from './picker'
import { showToast } from './toast'
import { onUrlChange } from './url-watch'

/** Metatags der Seite (Name klein geschrieben, erster Wert gilt). */
function readMeta() {
  const meta: Record<string, string> = {}
  for (const tag of document.querySelectorAll<HTMLMetaElement>('meta[name], meta[property]')) {
    const name = (tag.getAttribute('name') ?? tag.getAttribute('property') ?? '').toLowerCase()
    if (name && tag.content && !(name in meta)) meta[name] = tag.content
  }
  return meta
}

const pick: PickHandler = (value, setState) => {
  setState('loading')
  void addToProject(value).then((result) => {
    if (!result.ok) {
      setState('error')
      showToast(result.error, 'error')
      return
    }
    setState('done')
    showToast(result.created ? de.extension.added(result.title) : de.extension.alreadyAdded(result.title))
  })
}

function isOwnServer(serverUrl: string) {
  try {
    return new URL(serverUrl).origin === location.origin
  } catch {
    return false
  }
}

/** Einzelner Titel auf dieser Seite? Zuerst Metatags/Adresse, dann Primo-Kataloge (swisscovery …). */
async function findWork(href: string): Promise<IslandWork | undefined> {
  const work = detectPageWork(readMeta(), href, document.title)
  if (work) return { title: work.title ?? work.input, add: () => addToProject(work.input) }
  const record = primoRecordFromUrl(href)
  const pnx = record && (await fetchPnx(record).catch(() => undefined))
  const primo = pnx && pnxToWork(pnx)
  if (!primo) return undefined
  return { title: primo.title, add: () => (primo.csl ? addCslToProject(primo.csl) : addToProject(primo.input!)) }
}

/** Übernehmen-Symbol zeigen, wenn die Seite ein einzelner Titel ist – pro Adresse nur einmal. */
function watchPageWork(ctx: ContentScriptContext) {
  const island = createIsland()
  const shown = new Set<string>()
  onUrlChange(ctx, (href) => {
    island.hide()
    // Kurz warten: Single-Page-Apps setzen Metatags oft erst nach dem Adresswechsel.
    ctx.setTimeout(async () => {
      if (location.href !== href || shown.has(href)) return
      const work = await findWork(href)
      if (!work || location.href !== href || ctx.isInvalid) return
      shown.add(href)
      island.show(work)
    }, 800)
  })
}

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  async main(ctx) {
    // Extension neu geladen: alte Symbole entfernen, Timer und Beobachter enden über `ctx`.
    ctx.onInvalidated(() => document.querySelectorAll('olb-picker, olb-island, olb-toasts').forEach((el) => el.remove()))

    const settings = await settingsItem.getValue()
    // In OpenLitBase selbst weder Picker noch Übernehmen-Symbol.
    if (isOwnServer(settings.serverUrl)) return
    if (!settings.pickerEnabled) return
    watchPageWork(ctx)

    const scan = createPickerScanner(pick)
    scan(document.body)
    // Nachgeladene Inhalte (Trefferlisten, Endlos-Scrollen) gebündelt nachscannen.
    let pending: Node[] = []
    let timer: ReturnType<typeof setTimeout> | undefined
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) pending.push(...mutation.addedNodes)
      clearTimeout(timer)
      timer = setTimeout(() => {
        // Neue Textknoten über ihr Elternelement scannen (der TreeWalker liefert die Wurzel nicht).
        const roots = new Set(pending.map((node) => (node instanceof Text ? node.parentElement : node)))
        pending = []
        for (const root of roots) if (root?.isConnected) scan(root)
      }, 800)
    })
    observer.observe(document.body, { childList: true, subtree: true })
    ctx.onInvalidated(() => observer.disconnect())
  },
})
