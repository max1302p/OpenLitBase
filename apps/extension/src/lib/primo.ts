import type { CslItem } from '@litbase/shared'
import { cleanCatalogText } from '@litbase/shared/catalog-text'
import { normalizeDoi, normalizeIsbn } from '@litbase/shared/identifiers'

/**
 * Primo VE (swisscovery und viele andere Bibliothekskataloge): Detailseiten laden ihre Daten per
 * JavaScript und haben keine Metatags. Den Datensatz (PNX) liefert die öffentliche Schnittstelle
 * derselben Seite.
 */
export interface PrimoRecord {
  origin: string
  docid: string
  vid: string
  context: string
  lang: string
}

export function primoRecordFromUrl(href: string): PrimoRecord | undefined {
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return undefined
  }
  if (!url.pathname.endsWith('/discovery/fulldisplay')) return undefined
  const docid = url.searchParams.get('docid')
  const vid = url.searchParams.get('vid')
  if (!docid || !vid) return undefined
  return { origin: url.origin, docid, vid, context: url.searchParams.get('context') ?? 'L', lang: url.searchParams.get('lang') ?? 'de' }
}

type Pnx = { addata?: Record<string, string[] | undefined>; display?: Record<string, string[] | undefined> }

/** Datensatz laden; Einträge aus dem Central Index (Kontext PC) brauchen ein Gast-Token. */
export async function fetchPnx({ origin, docid, vid, context, lang }: PrimoRecord): Promise<Pnx | undefined> {
  const url = `${origin}/primaws/rest/pub/pnxs/${encodeURIComponent(context)}/${encodeURIComponent(docid)}?vid=${encodeURIComponent(vid)}&lang=${lang}`
  let res = await fetch(url)
  if (res.status === 401 || res.status === 403) {
    const institution = vid.split(':')[0]
    const token = await fetch(`${origin}/primaws/rest/pub/institution/${institution}/guestJwt?isGuest=true&lang=${lang}&viewId=${encodeURIComponent(vid)}`).then((r) => r.json() as Promise<string>)
    res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  }
  if (!res.ok) return undefined
  const body = (await res.json()) as { pnx?: Pnx }
  return body.pnx
}

const RIS_TYPES: Record<string, string> = {
  BOOK: 'book',
  JOUR: 'article-journal',
  CHAP: 'chapter',
  THES: 'thesis',
  RPRT: 'report',
  CONF: 'paper-conference',
  ELEC: 'webpage',
  NEWS: 'article-newspaper',
}

/** „Baker, Pam, 1960-“ → { family: 'Baker', given: 'Pam' }; ohne Komma = Körperschaft. */
function toName(raw: string) {
  const clean = cleanCatalogText(raw.split('$$')[0]!).replace(/,?\s*\d{4}-?(\d{4})?\.?$/, '').trim()
  const [family, given] = clean.split(/,\s*/)
  return given ? { family: family!, given } : { literal: clean }
}

/**
 * PNX → Übernahme: DOI oder ISBN (dann ergänzt der Server die Metadaten aus DOI- bzw.
 * ISBN-Quellen), sonst CSL aus den Katalogdaten.
 */
export function pnxToWork(pnx: Pnx): { title: string; input?: string; csl?: CslItem } | undefined {
  const a = pnx.addata ?? {}
  const first = (key: string) => (a[key]?.[0] && cleanCatalogText(a[key][0])) || undefined
  const displayTitle = pnx.display?.title?.[0]
  const title = first('btitle') ?? first('atitle') ?? (displayTitle && cleanCatalogText(displayTitle))
  if (!title) return undefined

  const doi = a.doi?.map((d) => normalizeDoi(d)).find(Boolean)
  if (doi) return { input: doi, title }
  const isbn = a.isbn?.map((i) => normalizeIsbn(i)).find(Boolean)
  if (isbn) return { input: isbn, title }

  const year = Number(first('date') ?? first('risdate')?.slice(0, 4))
  const pages = [first('spage'), first('epage')].filter(Boolean).join('-')
  const csl: CslItem = {
    type: RIS_TYPES[first('ristype') ?? ''] ?? 'book',
    title,
    ...(a.au?.length && { author: a.au.map(toName) }),
    ...(year && { issued: { 'date-parts': [[year]] } }),
    ...(first('pub') && { publisher: first('pub') }),
    ...(first('cop') && { 'publisher-place': first('cop') }),
    ...(first('edition') && { edition: first('edition') }),
    ...(first('jtitle') && { 'container-title': first('jtitle') }),
    ...(first('volume') && { volume: first('volume') }),
    ...(first('issue') && { issue: first('issue') }),
    ...(pages && { page: pages }),
    ...(first('issn') && { ISSN: first('issn') }),
  } as CslItem
  return { title, csl }
}
