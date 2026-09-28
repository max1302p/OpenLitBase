import { detectIdentifier, detectPageWork, findIdentifiers, PAGE_META_NAMES, type PageWork } from './identifiers'

/**
 * Lesezeichen-Skript für Browser ohne Extension (Safari, iOS): liest Adresse, Titel, markierten Text
 * und die Metatags aus `PAGE_META_NAMES` und öffnet `/add` von OpenLitBase in einem kleinen Fenster.
 * Die Angaben stehen im Fragment (`#`), gelangen also nicht in Server-Logs.
 */
export function bookmarkletUrl(origin: string) {
  const code = `(function(){var k=${JSON.stringify(PAGE_META_NAMES)},m={};document.querySelectorAll('meta[name],meta[property]').forEach(function(e){var n=(e.getAttribute('name')||e.getAttribute('property')||'').toLowerCase();if(k.indexOf(n)>=0&&e.content&&!(n in m))m[n]=e.content});var p=new URLSearchParams({u:location.href,t:document.title,s:String(getSelection()).slice(0,300),m:JSON.stringify(m)}),a=${JSON.stringify(`${origin}/add#`)}+p;window.open(a,'openlitbase','width=520,height=720')||(location.href=a)})()`
  return `javascript:${encodeURIComponent(code)}`
}

/** Was das Bookmarklet mitgeschickt hat → Angabe für `POST /api/items/identifier`. */
export interface BookmarkletWork extends PageWork {
  pageUrl: string
}

function parseMeta(raw: string | null) {
  const meta: Record<string, string> = {}
  try {
    const parsed: unknown = JSON.parse(raw ?? '{}')
    if (parsed && typeof parsed === 'object') {
      for (const [name, value] of Object.entries(parsed)) {
        if (PAGE_META_NAMES.includes(name) && typeof value === 'string') meta[name] = value
      }
    }
  } catch {
    // kaputte Angaben → nur Adresse und Titel
  }
  return meta
}

/**
 * Reihenfolge: markierte Nummer (z. B. ISBN im Katalog), dann Metatags bzw. Adresse wie bei der
 * Extension, sonst die Seiten-URL selbst (der Server liest dann die Seite).
 */
export function workFromBookmarklet(fragment: string): BookmarkletWork | undefined {
  const params = new URLSearchParams(fragment.replace(/^#/, ''))
  const pageUrl = params.get('u') ?? ''
  if (!/^https?:\/\//i.test(pageUrl)) return undefined
  const documentTitle = params.get('t')?.trim() || undefined
  const selection = params.get('s')?.trim() ?? ''
  const selected = findIdentifiers(selection)[0]?.value ?? detectIdentifier(selection)?.value
  const meta = parseMeta(params.get('m'))
  if (selected && selected !== pageUrl) return { input: selected, title: undefined, pageUrl }
  const title = (meta['citation_title'] || meta['dc.title'] || meta['og:title'])?.trim() || documentTitle
  return { input: detectPageWork(meta, pageUrl)?.input ?? pageUrl, title, pageUrl }
}
