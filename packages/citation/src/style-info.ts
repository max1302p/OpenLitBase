export interface StyleInfo {
  /** Dateiname ohne `.csl`, z. B. `ieee-de`. */
  id: string
  title: string
  /** `numeric`, `author-date`, `note` … aus `<category citation-format>`. */
  format: string | null
}

function decodeXml(text: string) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

/** Liest Titel und Zitierformat aus dem `<info>`-Block einer CSL-Datei. */
export function readStyleInfo(id: string, xml: string): StyleInfo {
  const title = xml.match(/<title>([^<]*)<\/title>/)?.[1]
  const format = xml.match(/<category\s+citation-format="([^"]+)"/)?.[1] ?? null
  return { id, title: title ? decodeXml(title.trim()) : id, format }
}
