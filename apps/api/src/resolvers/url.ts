import { normalizeDoi, normalizeIsbn, type CslItem } from '@litbase/shared'
import { safeFetch } from '../lib/safe-fetch'
import { parseDate, parseName, sanitizeCsl, today } from './csl-utils'
import { resolveDoi } from './doi'
import { readMetaTags } from './html-meta'

const MAX_HTML_BYTES = 2_000_000

async function fetchHtml(url: string) {
  const res = await safeFetch(url, { headers: { Accept: 'text/html,application/xhtml+xml' } })
  if (!res.ok || !res.headers.get('content-type')?.includes('html')) return undefined
  const text = await res.text()
  return text.slice(0, MAX_HTML_BYTES)
}

/** Seite abrufen und `citation_*`-, Dublin-Core- und OpenGraph-Metatags auswerten. */
export async function resolveUrl(url: string): Promise<CslItem | undefined> {
  const html = await fetchHtml(url)
  if (!html) return undefined
  const meta = readMetaTags(html)

  // Wissenschaftliche Seiten verweisen oft auf eine DOI – die liefert die besseren Metadaten.
  const doi = normalizeDoi(meta.get('citation_doi', 'dc.identifier', 'prism.doi') ?? '')
  if (doi) {
    const csl = await resolveDoi(doi)
    if (csl) return { ...csl, URL: csl.URL ?? url }
  }

  const title = meta.get('citation_title', 'dc.title', 'og:title', 'twitter:title') ?? meta.title
  if (!title) return undefined
  const journal = meta.get('citation_journal_title')
  const conference = meta.get('citation_conference_title')
  const firstPage = meta.get('citation_firstpage')
  const lastPage = meta.get('citation_lastpage')
  const isbn = meta.get('citation_isbn')

  return sanitizeCsl({
    type: journal ? 'article-journal' : conference ? 'paper-conference' : 'webpage',
    title,
    author: meta.all('citation_author', 'dc.creator', 'author').map(parseName),
    'container-title': journal ?? conference ?? meta.get('og:site_name'),
    publisher: meta.get('citation_publisher', 'dc.publisher'),
    volume: meta.get('citation_volume'),
    issue: meta.get('citation_issue'),
    page: [firstPage, lastPage].filter(Boolean).join('-'),
    issued: parseDate(
      meta.get('citation_publication_date', 'citation_date', 'dc.date', 'article:published_time'),
    ),
    ISBN: isbn ? normalizeIsbn(isbn) : undefined,
    abstract: meta.get('citation_abstract', 'dc.description', 'og:description', 'description'),
    URL: url,
    accessed: today(),
  })
}
