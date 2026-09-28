import type { CslItem } from '@litbase/shared'
import { fetchJson } from '../lib/safe-fetch'
import { cleanText, parseName, sanitizeCsl } from './csl-utils'

type CslDate = { 'date-parts'?: unknown[][] } | undefined

/**
 * Für Literaturverzeichnisse zählt der Jahrgang des Hefts, nicht das Online-first-Datum:
 * Druck → Heft (Druck) → Heft (online) → `issued`.
 */
function citableDate(raw: Record<string, unknown>) {
  const issue = raw['journal-issue'] as Record<string, CslDate> | undefined
  const candidates = [
    raw['published-print'] as CslDate,
    issue?.['published-print'],
    issue?.['published-online'],
    raw.issued as CslDate,
  ]
  return candidates.find((d) => d?.['date-parts']?.[0]?.[0])
}

function fromCrossrefLike(raw: Record<string, unknown>) {
  return sanitizeCsl({ ...raw, issued: citableDate(raw) })
}

async function fromContentNegotiation(doi: string) {
  const csl = await fetchJson<Record<string, unknown>>(`https://doi.org/${encodeURI(doi)}`, {
    headers: { Accept: 'application/vnd.citationstyles.csl+json' },
  })
  return csl?.title ? fromCrossrefLike(csl) : undefined
}

async function fromCrossref(doi: string) {
  const data = await fetchJson<{ message: Record<string, unknown> }>(
    `https://api.crossref.org/works/${encodeURIComponent(doi)}`,
  )
  const msg = data?.message
  if (!msg?.title) return undefined
  return fromCrossrefLike(msg)
}

interface OpenAlexWork {
  title?: string
  type?: string
  publication_date?: string
  authorships?: { author: { display_name: string } }[]
  primary_location?: { source?: { display_name?: string; host_organization_name?: string } }
  biblio?: { volume?: string; issue?: string; first_page?: string; last_page?: string }
}

async function fromOpenAlex(doi: string) {
  const work = await fetchJson<OpenAlexWork>(`https://api.openalex.org/works/https://doi.org/${doi}`)
  if (!work?.title) return undefined
  const { biblio, primary_location: location } = work
  const page = [biblio?.first_page, biblio?.last_page].filter(Boolean).join('-')
  return sanitizeCsl({
    type: work.type === 'article' ? 'article-journal' : work.type,
    title: cleanText(work.title),
    author: work.authorships?.map((a) => parseName(a.author.display_name)),
    'container-title': location?.source?.display_name,
    publisher: location?.source?.host_organization_name,
    volume: biblio?.volume,
    issue: biblio?.issue,
    page,
    issued: work.publication_date
      ? { 'date-parts': [work.publication_date.split('-').map(Number)] }
      : undefined,
  })
}

/** DOI: Content-Negotiation (Crossref/DataCite) → Crossref-API → OpenAlex. */
export async function resolveDoi(doi: string): Promise<CslItem | undefined> {
  const csl =
    (await fromContentNegotiation(doi)) ?? (await fromCrossref(doi)) ?? (await fromOpenAlex(doi))
  if (!csl) return undefined
  // doi.org-Links sind redundant zur DOI.
  const url = typeof csl.URL === 'string' && /doi\.org\//i.test(csl.URL) ? undefined : csl.URL
  return { ...csl, DOI: doi, URL: url }
}
