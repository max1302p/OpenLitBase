import { formatDocument } from '@litbase/citation'
import { de, type DocumentCitation, type FormattedDocument } from '@litbase/shared'
import { bibliographyOoxml } from '../exports/ooxml'
import { toEngineItems, type FormattableItem } from './format'
import { styles } from './styles'

/**
 * Zitate eines Word-Dokuments in Dokumentreihenfolge formatieren (numerische Stile nummerieren
 * nach erster Zitation) plus das passende Literaturverzeichnis als OOXML.
 * Zitate, deren Titel nicht (mehr) existieren, erscheinen als „[?]“.
 */
export function renderDocument(
  styleId: string,
  items: FormattableItem[],
  citations: DocumentCitation[],
): FormattedDocument {
  const styleXml = styles.getStyleXml(styleId)
  if (!styleXml) throw new Error(`Zitierstil nicht gefunden: ${styleId}`)
  const known = new Set(items.map((item) => item.id))
  const resolvable = citations
    .map((citation) => ({
      id: citation.id,
      items: citation.items
        .filter((item) => known.has(item.id))
        .map((item) => ({ id: item.id, ...(item.locator && { locator: item.locator, label: 'page' }) })),
    }))
    .filter((citation) => citation.items.length > 0)

  const input = { styleXml, loadLocale: styles.loadLocale, items: toEngineItems(items), citations: resolvable }
  const text = formatDocument({ ...input, format: 'text' })
  const html = formatDocument({ ...input, format: 'html' })
  const rendered = new Map(text.citations.map((c) => [c.id, c.text]))

  return {
    styleId,
    citations: citations.map((c) => ({ id: c.id, text: rendered.get(c.id) ?? de.addin.missingCitation })),
    bibliographyOoxml: html.bibliography.length > 0 ? bibliographyOoxml(html.bibliography.map((e) => e.text)) : '',
    bibliographyCount: html.bibliography.length,
  }
}
