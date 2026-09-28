import type { BibliographyEntry, CitationInput, CslItem } from './types'

/**
 * Styles mit diesem Kommentar setzen Seitenangaben ins Verzeichnis statt in den Text
 * (verbreitet in Hochschul-Merkblättern zu IEEE): im Text nur „[1]“, im Verzeichnis
 * „[1] … 2008, S. 56.“. Jede Kombination aus Titel und Seite bekommt eine eigene Nummer.
 */
const MARKER = '<!-- openlitbase:locator-in-bibliography -->'

export const hasLocatorInBibliography = (styleXml: string) => styleXml.includes(MARKER)

/** Pro Titel und Seite eine Kopie des Titels anlegen; die Zitate verweisen ohne Seite darauf. */
export function splitByLocator(items: CslItem[], citations: CitationInput[]) {
  const byId = new Map(items.map((item) => [item.id, item]))
  const copies = new Map<string, CslItem>()
  const locators = new Map<string, string>()

  const split = citations.map((citation) => ({
    ...citation,
    items: citation.items.map(({ id, locator }) => {
      const item = byId.get(id)
      if (!locator || !item) return { id }
      const key = `${id}@${locator}`
      copies.set(key, { ...item, id: key })
      locators.set(key, locator)
      return { id: key }
    }),
  }))
  return { items: [...items, ...copies.values()], citations: split, locators }
}

/** Online-Teil am Ende eines Eintrags in `ieee-de-seite.csl`; die Seite gehört davor. */
const ONLINE_PART = /\s(?:doi: |\[Online\] Available: )/

/**
 * „…, 2008.“ → „…, 2008, S. 56.“ und „…, 2024. doi: …“ → „…, 2024, S. 56. doi: …“ –
 * auch vor HTML-Tags am Ende des Eintrags.
 */
export function appendLocators(entries: BibliographyEntry[], locators: Map<string, string>) {
  return entries.map((entry) => {
    const locator = locators.get(entry.id)
    if (!locator) return entry
    const page = `, ${/^s\.\s/i.test(locator) ? locator : `S. ${locator}`}.`
    const online = entry.text.search(ONLINE_PART)
    if (online >= 0) {
      const main = entry.text.slice(0, online).replace(/[.,]$/, '')
      return { ...entry, text: `${main}${page}${entry.text.slice(online)}` }
    }
    const [, body = entry.text, end = ''] = entry.text.match(/^(.*?)\.?((?:\s*<\/[^>]+>)*)$/s) ?? []
    return { ...entry, text: `${body}${page}${end}` }
  })
}
