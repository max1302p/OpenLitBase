import { cleanCatalogText, type CslItem, type CslName } from '@litbase/shared'

/** Erlaubte CSL-1.0.2-Variablen. Alles andere (z. B. Crossref-Referenzlisten) wird verworfen. */
const CSL_VARIABLES = new Set([
  'type', 'id', 'citation-key', 'language', 'abstract', 'annote', 'archive', 'archive_location',
  'archive-place', 'authority', 'call-number', 'chapter-number', 'citation-label', 'collection-number',
  'collection-title', 'container-title', 'container-title-short', 'dimensions', 'division', 'DOI',
  'edition', 'event', 'event-title', 'event-place', 'genre', 'ISBN', 'ISSN', 'issue', 'jurisdiction',
  'keyword', 'medium', 'note', 'number', 'number-of-pages', 'number-of-volumes', 'original-publisher',
  'original-publisher-place', 'original-title', 'page', 'page-first', 'part', 'part-title', 'PMCID',
  'PMID', 'publisher', 'publisher-place', 'references', 'reviewed-genre', 'reviewed-title', 'scale',
  'section', 'source', 'status', 'supplement', 'title', 'title-short', 'URL', 'version', 'volume',
  'volume-title', 'year-suffix', 'accessed', 'available-date', 'event-date', 'issued', 'original-date',
  'submitted', 'author', 'chair', 'collection-editor', 'compiler', 'composer', 'container-author',
  'contributor', 'curator', 'director', 'editor', 'editorial-director', 'executive-producer',
  'guest', 'host', 'illustrator', 'interviewer', 'narrator', 'organizer', 'original-author',
  'performer', 'producer', 'recipient', 'reviewed-author', 'script-writer', 'series-creator',
  'translator',
])

/** Crossref-/OpenAlex-Typen, die von CSL abweichen. */
const TYPE_ALIASES: Record<string, string> = {
  'journal-article': 'article-journal',
  'proceedings-article': 'paper-conference',
  'book-chapter': 'chapter',
  'posted-content': 'article',
  preprint: 'article',
  dissertation: 'thesis',
  monograph: 'book',
  'edited-book': 'book',
  'reference-book': 'book',
  'report-component': 'report',
}

const NAME_KEYS = ['family', 'given', 'literal', 'suffix', 'dropping-particle', 'non-dropping-particle']

/** Nur CSL-Namensteile behalten (Crossref liefert u. a. `affiliation`, `sequence`, `ORCID`). */
function cleanNames(names: unknown[]) {
  return names.map((name) =>
    Object.fromEntries(
      Object.entries(name as Record<string, unknown>).filter(
        ([key, value]) => NAME_KEYS.includes(key) && typeof value === 'string' && value,
      ),
    ),
  )
}

/** Entfernt Nicht-CSL-Felder, leere Werte und macht Arrays aus Crossref-Titeln zu Strings. */
export function sanitizeCsl(input: Record<string, unknown>): CslItem {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input)) {
    if (!CSL_VARIABLES.has(key) || key === 'id' || value == null || value === '') continue
    if (Array.isArray(value) && value.length === 0) continue
    const isNameList = Array.isArray(value) && typeof value[0] === 'object'
    out[key] = isNameList ? cleanNames(value) : Array.isArray(value) ? value[0] : value
  }
  if (typeof out.type === 'string') out.type = TYPE_ALIASES[out.type] ?? out.type
  if (typeof out.title === 'string') out.title = cleanText(out.title)
  if (typeof out.abstract === 'string') out.abstract = stripTags(out.abstract)
  return { type: 'document', ...out } as CslItem
}

/** Erst Katalogmarken („<<Die>>“) auflösen, dann HTML-Tags entfernen – sonst ginge „Die“ verloren. */
export function cleanText(text: string) {
  return stripTags(cleanCatalogText(text)).replace(/\s+/g, ' ').trim()
}

function stripTags(text: string) {
  return text.replace(/<[^>]+>/g, '')
}

/** „Nachname, Vorname“ oder „Vorname Nachname“ → CSL-Name. */
export function parseName(raw: string): CslName {
  // Schlusspunkt nur entfernen, wenn er keine Initiale abschliesst („Joseph J.“ bleibt).
  const name = raw.replace(/\s+/g, ' ').replace(/[,;:]+$/, '').replace(/(?<!\b\p{Lu})\.$/u, '').trim()
  if (name.includes(',')) {
    const [family, ...given] = name.split(',')
    return { family: family!.trim(), given: given.join(',').trim() }
  }
  const parts = name.split(' ')
  if (parts.length === 1) return { literal: name }
  return { family: parts.pop()!, given: parts.join(' ') }
}

/** „2015 May 28“, „2015-05-28“, „2015“ → CSL-Datum (nur Jahr/Monat/Tag, soweit erkennbar). */
export function parseDate(raw: string | undefined): CslItem['issued'] {
  if (!raw) return undefined
  const iso = raw.match(/(\d{4})(?:[-/](\d{1,2}))?(?:[-/](\d{1,2}))?/)
  if (!iso) return undefined
  const parts = [Number(iso[1]), iso[2] && Number(iso[2]), iso[3] && Number(iso[3])].filter(
    (p): p is number => typeof p === 'number' && p > 0,
  )
  if (parts.length === 1) {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    const month = months.findIndex((m) => raw.toLowerCase().includes(m))
    if (month >= 0) parts.push(month + 1)
  }
  return { 'date-parts': [parts] }
}

export function today(): CslItem['accessed'] {
  const d = new Date()
  return { 'date-parts': [[d.getFullYear(), d.getMonth() + 1, d.getDate()]] }
}
