import { decodeEntities } from '../resolvers/html-meta'

export interface TextSegment {
  text: string
  italics?: boolean
  bold?: boolean
  superScript?: boolean
  subScript?: boolean
  smallCaps?: boolean
}

/**
 * Zerlegt die Inline-HTML-Ausgabe von citeproc (<i>, <b>, <sup>, <sub>, <span style>) in
 * formatierte Textsegmente – für DOCX und Markdown.
 */
export function parseInlineHtml(html: string): TextSegment[] {
  const segments: TextSegment[] = []
  const stack: Partial<TextSegment>[] = []
  const current = () => Object.assign({}, ...stack) as Partial<TextSegment>

  for (const token of html.split(/(<[^>]+>)/)) {
    if (!token) continue
    const tag = token.match(/^<(\/?)(\w+)([^>]*)>$/)
    if (!tag) {
      segments.push({ ...current(), text: decodeEntities(token) })
      continue
    }
    const [, closing, name, attrs] = tag
    if (closing) {
      stack.pop()
      continue
    }
    const style = attrs ?? ''
    stack.push({
      ...(name === 'i' || name === 'em' || /font-style:\s*italic/.test(style) ? { italics: true } : {}),
      ...(/font-style:\s*normal/.test(style) ? { italics: false } : {}),
      ...(name === 'b' || name === 'strong' || /font-weight:\s*bold/.test(style) ? { bold: true } : {}),
      ...(name === 'sup' ? { superScript: true } : {}),
      ...(name === 'sub' ? { subScript: true } : {}),
      ...(/small-caps/.test(style) ? { smallCaps: true } : {}),
    })
    if (name === 'br' || attrs?.endsWith('/')) stack.pop()
  }
  return segments.filter((s) => s.text)
}

/** Linke Spalte (z. B. „[1]“) und Eintragstext aus einem citeproc-`csl-entry` trennen. */
export function splitEntry(html: string) {
  const left = html.match(/<div class="csl-left-margin">([\s\S]*?)<\/div>/)?.[1]
  const right = html.match(/<div class="csl-right-inline">([\s\S]*?)<\/div>/)?.[1]
  if (left !== undefined && right !== undefined) return { label: left.trim(), body: right.trim() }
  const body = html.replace(/^<div class="csl-entry">|<\/div>$/g, '').trim()
  return { label: undefined, body }
}

function escapeMarkdown(text: string) {
  return text.replace(/([\\*_`[\]])/g, '\\$1')
}

export function entryToMarkdown(html: string) {
  const { label, body } = splitEntry(html)
  const md = parseInlineHtml(body)
    .map((s) => {
      const text = escapeMarkdown(s.text)
      if (s.bold && s.italics) return `***${text}***`
      if (s.bold) return `**${text}**`
      if (s.italics) return `*${text}*`
      return text
    })
    .join('')
  return label ? `${escapeMarkdown(label)} ${md}` : md
}
