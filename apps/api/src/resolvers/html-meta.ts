/** Liest `<meta name|property="…" content="…">` und `<title>` aus HTML (ohne DOM-Parser). */
export function readMetaTags(html: string) {
  const head = html.slice(0, 500_000)
  const tags = new Map<string, string[]>()
  for (const [tag] of head.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = Object.fromEntries(
      [...tag.matchAll(/([\w:.-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)].map((m) => [
        m[1]!.toLowerCase(),
        decodeEntities(m[3] ?? m[4] ?? ''),
      ]),
    )
    const key = (attrs.name ?? attrs.property)?.toLowerCase()
    const content = attrs.content?.trim()
    if (!key || !content) continue
    tags.set(key, [...(tags.get(key) ?? []), content])
  }
  const title = head.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]

  return {
    get: (...keys: string[]) => keys.map((k) => tags.get(k)?.[0]).find(Boolean),
    all: (...keys: string[]) => keys.flatMap((k) => tags.get(k) ?? []),
    title: title ? decodeEntities(title).trim() : undefined,
  }
}

export function decodeEntities(text: string) {
  return text
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
}
