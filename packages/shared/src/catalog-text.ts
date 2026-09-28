const NAMED_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

/**
 * Text aus Bibliothekskatalogen bereinigen: Zeichenreferenzen (`&#152;`, `&#x9C;`, `&amp;`) auflösen
 * und MARC-Nichtsortierzeichen entfernen. Kataloge markieren damit Artikel, die beim Sortieren
 * übersprungen werden: „&#152;Die&#156; KI-Verordnung“ bzw. „<<Die>> KI-Verordnung“ → „Die KI-Verordnung“
 * (U+0098/U+009C, in MARC-8 auch U+0088/U+0089, in manchen Katalogen doppelte spitze Klammern).
 */
export function cleanCatalogText(text: string) {
  return text
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, name: string) => NAMED_ENTITIES[name]!)
    .replace(/[\u0088\u0089\u0098\u009c]/g, '')
    .replace(/<<([^<>]*)>>/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}
