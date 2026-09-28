import { de } from '@litbase/shared/de'
import { findIdentifiers, identifierFromUrl } from '@litbase/shared/identifiers'

/** Höchstens so viele Symbole pro Seite – lange Literaturlisten sollen die Seite nicht fluten. */
const MAX_PICKERS = 100
const SKIP = 'script,style,noscript,textarea,input,select,option,button,svg,canvas,code,pre,olb-picker,olb-toasts,olb-island,[contenteditable=""],[contenteditable="true"]'
const HINT = /10\.\d|ISBN|arXiv|PMID/i

const ICONS = {
  idle: '<path d="M12 5v14M5 12h14"/>',
  loading: '<path d="M21 12a9 9 0 1 1-6.2-8.6"/>',
  done: '<path d="M20 6 9 17l-5-5"/>',
  error: '<path d="M12 8v5M12 16.5v.5"/>',
}

export type PickerState = keyof typeof ICONS
export type PickHandler = (value: string, setState: (state: PickerState) => void) => void

function createPicker(value: string, onPick: PickHandler) {
  const host = document.createElement('olb-picker')
  host.style.cssText = 'display:inline-block;margin:0 2px 0 4px;vertical-align:middle;line-height:0'
  const shadow = host.attachShadow({ mode: 'closed' })
  shadow.innerHTML = `<style>
    button { all:initial; box-sizing:border-box; cursor:pointer; display:inline-flex; align-items:center;
      justify-content:center; width:18px; height:18px; border-radius:9px; background:#0B2351; color:#fff;
      box-shadow:0 1px 2px rgba(0,0,0,.3); transition:transform .1s; }
    button:hover { transform:scale(1.15); }
    button[data-state=loading] { cursor:progress; }
    button[data-state=loading] svg { animation:spin .8s linear infinite; }
    button[data-state=done] { background:#067647; }
    button[data-state=error] { background:#b42318; }
    svg { width:12px; height:12px; fill:none; stroke:currentColor; stroke-width:3; stroke-linecap:round; stroke-linejoin:round; }
    @keyframes spin { to { transform:rotate(360deg); } }
  </style><button type="button"></button>`
  const button = shadow.querySelector('button')!
  button.title = `${de.extension.pickerTitle}: ${value}`
  const setState = (state: PickerState) => {
    button.dataset.state = state
    button.innerHTML = `<svg viewBox="0 0 24 24">${ICONS[state]}</svg>`
  }
  setState('idle')
  button.addEventListener('click', (event) => {
    // Das Symbol kann in einem Link stehen: nicht navigieren.
    event.preventDefault()
    event.stopPropagation()
    if (button.dataset.state !== 'loading') onPick(value, setState)
  })
  return host
}

/** Setzt neben jede gefundene DOI, ISBN, arXiv-ID und PMID ein Picker-Symbol (je Wert einmal). */
export function createPickerScanner(onPick: PickHandler) {
  const seen = new Set<string>()

  function accept(type: string, value: string) {
    const key = `${type}:${value}`
    if (seen.has(key) || seen.size >= MAX_PICKERS) return false
    seen.add(key)
    return true
  }

  function scanText(node: Text) {
    const found = findIdentifiers(node.data).filter((f) => accept(f.type, f.value))
    const anchor = node.parentElement?.closest('a')
    // Von hinten einfügen, damit die Positionen der vorderen Treffer gültig bleiben.
    for (const f of found.reverse()) {
      const picker = createPicker(f.value, onPick)
      if (anchor) anchor.after(picker)
      else node.splitText(f.index + f.length).before(picker)
    }
  }

  function scanLinks(root: Element) {
    for (const link of root.querySelectorAll<HTMLAnchorElement>('a[href]')) {
      if (link.closest(SKIP)) continue
      const id = identifierFromUrl(link.href)
      if (id && accept(id.type, id.value)) link.after(createPicker(id.value, onPick))
    }
  }

  return function scan(root: Node) {
    if (seen.size >= MAX_PICKERS) return
    const texts: Text[] = []
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        const parent = node.parentElement
        if (!parent || !HINT.test((node as Text).data) || parent.closest(SKIP)) return NodeFilter.FILTER_REJECT
        return NodeFilter.FILTER_ACCEPT
      },
    })
    while (walker.nextNode()) texts.push(walker.currentNode as Text)
    texts.forEach(scanText)
    if (root instanceof Element) scanLinks(root)
  }
}
