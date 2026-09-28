import { formatBibliography, type CslItem as EngineItem } from '@litbase/citation'
import type { Bibliography, CslItem } from '@litbase/shared'
import { styles } from './styles'

export interface FormattableItem {
  id: string
  csl: CslItem
}

export function toEngineItems(items: FormattableItem[]): EngineItem[] {
  return items.map(({ id, csl }) => ({ ...csl, id }))
}

/** Sortierschlüssel für Verzeichnisse ohne Dokumentkontext: erste:r Autor:in, dann Titel. */
function sortKey({ csl }: FormattableItem) {
  const first = csl.author?.[0] ?? csl.editor?.[0]
  const name = first?.family ?? first?.literal ?? ''
  return `${name} ${csl.title ?? ''}`.toLocaleLowerCase('de')
}

/**
 * Formatiertes Literaturverzeichnis (HTML und Text). Numerische Stile nummerieren
 * alphabetisch; die Reihenfolge nach erster Zitation übernimmt das Word-Add-in.
 */
export function renderBibliography(styleId: string, items: FormattableItem[]): Bibliography {
  const styleXml = styles.getStyleXml(styleId)
  if (!styleXml) throw new Error(`Zitierstil nicht gefunden: ${styleId}`)
  const sorted = [...items].sort((a, b) => sortKey(a).localeCompare(sortKey(b), 'de'))
  const input = { styleXml, loadLocale: styles.loadLocale, items: toEngineItems(sorted) }
  const html = formatBibliography({ ...input, format: 'html' })
  const text = formatBibliography({ ...input, format: 'text' })
  return {
    styleId,
    entries: html.map((entry, i) => ({ id: entry.id, html: entry.text, text: text[i]?.text ?? '' })),
  }
}
