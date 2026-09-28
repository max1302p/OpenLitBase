export type IdentifierType = 'doi' | 'isbn' | 'arxiv' | 'pmid' | 'url'

export interface Identifier {
  type: IdentifierType
  /** Normalisierter Wert: DOI ohne Präfix, ISBN nur Ziffern (ISBN-13), arXiv ohne Version-Präfix. */
  value: string
}

const DOI_RE = /\b(10\.\d{4,9}\/[^\s"'<>]+)/i
const ARXIV_NEW_RE = /^(?:arxiv:)?(\d{4}\.\d{4,5})(v\d+)?$/i
const ARXIV_OLD_RE = /^(?:arxiv:)?([a-z-]+(?:\.[a-z]{2})?\/\d{7})(v\d+)?$/i
const ARXIV_URL_RE = /arxiv\.org\/(?:abs|pdf)\/([^\s?#]+?)(?:\.pdf)?(?:[?#]|$)/i
const PUBMED_URL_RE = /pubmed\.ncbi\.nlm\.nih\.gov\/(\d{1,8})/i
const PMID_RE = /^(?:pmid:?\s*)?(\d{1,8})$/i

/** Entfernt Satzzeichen, die beim Kopieren oft am DOI hängen bleiben. */
function trimDoi(doi: string) {
  return decodeURIComponent(doi).replace(/[.,;:)\]}]+$/, '')
}

function isbn10Valid(digits: string) {
  if (!/^\d{9}[\dX]$/i.test(digits)) return false
  const sum = [...digits].reduce(
    (acc, ch, i) => acc + (ch.toUpperCase() === 'X' ? 10 : Number(ch)) * (10 - i),
    0,
  )
  return sum % 11 === 0
}

function isbn13Valid(digits: string) {
  if (!/^97[89]\d{10}$/.test(digits)) return false
  const sum = [...digits].reduce((acc, ch, i) => acc + Number(ch) * (i % 2 === 0 ? 1 : 3), 0)
  return sum % 10 === 0
}

/** Wandelt eine ISBN-10 in die entsprechende ISBN-13 um. */
export function isbn10To13(isbn10: string) {
  const core = `978${isbn10.slice(0, 9)}`
  const sum = [...core].reduce((acc, ch, i) => acc + Number(ch) * (i % 2 === 0 ? 1 : 3), 0)
  return core + ((10 - (sum % 10)) % 10)
}

/** Gültige ISBN (10 oder 13, mit oder ohne Bindestriche) → ISBN-13 als Ziffernfolge. */
export function normalizeIsbn(input: string): string | undefined {
  const digits = input.replace(/^isbn(?:-1[03])?:?\s*/i, '').replace(/[\s-]/g, '')
  if (isbn13Valid(digits)) return digits
  if (isbn10Valid(digits)) return isbn10To13(digits.toUpperCase())
  return undefined
}

export function normalizeDoi(input: string): string | undefined {
  const match = input.match(DOI_RE)
  return match?.[1] ? trimDoi(match[1]) : undefined
}

/**
 * Erkennt, was in das Eingabefeld „Titel hinzufügen“ eingegeben wurde.
 * Reihenfolge: DOI → arXiv/PubMed-URL → ISBN → PMID → arXiv-ID → sonstige URL.
 */
export function detectIdentifier(raw: string): Identifier | undefined {
  const input = raw.trim()
  if (!input) return undefined

  const doi = normalizeDoi(input)
  if (doi) return { type: 'doi', value: doi }

  const arxivUrl = input.match(ARXIV_URL_RE)?.[1]
  if (arxivUrl) return { type: 'arxiv', value: arxivUrl.replace(/v\d+$/, '') }

  const pubmedUrl = input.match(PUBMED_URL_RE)?.[1]
  if (pubmedUrl) return { type: 'pmid', value: pubmedUrl }

  const isbn = normalizeIsbn(input)
  if (isbn) return { type: 'isbn', value: isbn }

  const pmid = input.match(PMID_RE)?.[1]
  if (pmid) return { type: 'pmid', value: pmid }

  const arxiv = input.match(ARXIV_NEW_RE) ?? input.match(ARXIV_OLD_RE)
  if (arxiv?.[1]) return { type: 'arxiv', value: arxiv[1] }

  if (/^https?:\/\/\S+$/i.test(input)) return { type: 'url', value: input }
  return undefined
}

export interface FoundIdentifier extends Identifier {
  /** Position und Länge des Treffers im durchsuchten Text. */
  index: number
  length: number
}

/**
 * Muster für Fliesstext (Browser-Extension). ISBN, arXiv und PMID nur mit Präfix,
 * sonst wären beliebige Zahlen Treffer.
 */
const TEXT_PATTERNS: { type: Exclude<IdentifierType, 'url'>; re: RegExp; normalize: (m: RegExpExecArray) => string | undefined }[] = [
  { type: 'doi', re: /\b10\.\d{4,9}\/[^\s"'<>]+/g, normalize: (m) => normalizeDoi(m[0]) },
  {
    type: 'isbn',
    re: /\bISBN(?:-1[03])?:?\s*((?:97[89][\s-]?)?(?:\d[\s-]?){9}[\dX])(?![\d-])/gi,
    normalize: (m) => normalizeIsbn(m[1]!),
  },
  {
    type: 'arxiv',
    re: /\barXiv:\s*(\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Z]{2})?\/\d{7})(?:v\d+)?/gi,
    normalize: (m) => m[1],
  },
  { type: 'pmid', re: /\bPMID:?\s*(\d{1,8})\b/gi, normalize: (m) => m[1] },
]

/** Alle DOIs, ISBNs, arXiv-IDs und PMIDs in einem Text, nach Position sortiert, ohne Überlappungen. */
export function findIdentifiers(text: string): FoundIdentifier[] {
  const found: FoundIdentifier[] = []
  for (const { type, re, normalize } of TEXT_PATTERNS) {
    for (const match of text.matchAll(re)) {
      const value = normalize(match as RegExpExecArray)
      if (!value) continue
      // Beim DOI zählt nur der bereinigte Teil (ohne Satzzeichen am Ende) zur Markierung.
      const length = type === 'doi' ? match[0].replace(/[.,;:)\]}]+$/, '').length : match[0].length
      found.push({ type, value, index: match.index, length })
    }
  }
  found.sort((a, b) => a.index - b.index)
  return found.filter((f, i) => i === 0 || f.index >= found[i - 1]!.index + found[i - 1]!.length)
}

/** DOI-, arXiv- und PubMed-Links → Identifier (für Links, deren Text nur der Titel ist). */
export function identifierFromUrl(href: string): Identifier | undefined {
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return undefined
  }
  if (/^(dx\.)?doi\.org$/i.test(url.hostname)) {
    const doi = normalizeDoi(decodeURIComponent(url.pathname.slice(1)))
    return doi ? { type: 'doi', value: doi } : undefined
  }
  if (/(^|\.)arxiv\.org$/i.test(url.hostname) || /pubmed\.ncbi\.nlm\.nih\.gov$/i.test(url.hostname)) {
    const id = detectIdentifier(href)
    return id && id.type !== 'url' ? id : undefined
  }
  return undefined
}

/** Metatag-Namen (klein geschrieben) in der Reihenfolge, in der sie gelten. */
const META_IDENTIFIERS: [string, IdentifierType][] = [
  ['citation_doi', 'doi'],
  ['prism.doi', 'doi'],
  ['bepress_citation_doi', 'doi'],
  ['dc.identifier', 'doi'],
  ['citation_arxiv_id', 'arxiv'],
  ['citation_pmid', 'pmid'],
  ['citation_isbn', 'isbn'],
]

/** Metatags, die `detectPageWork` auswertet (auch das Bookmarklet liest nur diese aus). */
export const PAGE_META_NAMES = [...META_IDENTIFIERS.map(([name]) => name), 'citation_title', 'dc.title', 'og:title']

/** Titel und Angabe, mit der sich eine Seite übernehmen lässt (Browser-Extension). */
export interface PageWork {
  /** Für `POST /api/items/identifier`: DOI, arXiv-ID, PMID, ISBN oder die Seiten-URL. */
  input: string
  title?: string
}

/**
 * Ist diese Seite ein einzelner Titel? Nur bei klarem Signal – sonst undefined (kein Übernehmen-Symbol):
 * 1. DOI, arXiv-ID, PMID oder ISBN in den Metatags,
 * 2. DOI-, arXiv- oder PubMed-Adresse bzw. DOI im Pfad,
 * 3. Verlags-Metatags (`citation_title`) – dann liest der Server die Seite selbst.
 * Suchergebnisse, News oder Startseiten haben nichts davon und bekommen kein Symbol.
 */
export function detectPageWork(meta: Record<string, string>, pageUrl: string, documentTitle?: string): PageWork | undefined {
  const title = (meta['citation_title'] || meta['dc.title'] || meta['og:title'] || documentTitle || '').trim() || undefined
  for (const [name, type] of META_IDENTIFIERS) {
    const value = meta[name]
    if (!value) continue
    const id = type === 'doi' ? normalizeDoi(value) : type === 'isbn' ? normalizeIsbn(value) : detectIdentifier(value)?.value
    if (id) return { input: id, title }
  }
  let path = ''
  try {
    const url = new URL(pageUrl)
    path = url.pathname
  } catch {
    return undefined
  }
  const fromUrl = identifierFromUrl(pageUrl)?.value ?? normalizeDoi(decodeURIComponent(path))
  if (fromUrl) return { input: fromUrl, title }
  if (meta['citation_title']) return { input: pageUrl, title }
  return undefined
}
