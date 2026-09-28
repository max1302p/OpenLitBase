import type { CslItem } from '@litbase/shared'
import { fetchText } from '../lib/safe-fetch'
import { cleanText, parseDate, parseName, sanitizeCsl } from './csl-utils'
import { findAll, parseXml, text } from './xml'

/** arXiv-API (Atom). Preprints werden als `article` mit arXiv-DOI gespeichert. */
export async function resolveArxiv(id: string): Promise<CslItem | undefined> {
  const xml = await fetchText(`https://export.arxiv.org/api/query?id_list=${encodeURIComponent(id)}`)
  if (!xml) return undefined
  const entry = findAll(parseXml(xml), 'title').find((e) => 'published' in e)
  const title = text(entry?.title)
  if (!entry || !title) return undefined

  const authors = (entry.author as { name: unknown }[] | undefined) ?? []
  const journalRef = text(entry.journal_ref)
  return sanitizeCsl({
    type: 'article',
    title: cleanText(title),
    author: authors.map((a) => parseName(text(a.name) ?? '')),
    abstract: cleanText(text(entry.summary) ?? ''),
    issued: parseDate(text(entry.published)),
    publisher: 'arXiv',
    number: `arXiv:${id}`,
    DOI: text(entry.doi) ?? `10.48550/arXiv.${id}`,
    URL: `https://arxiv.org/abs/${id}`,
    note: journalRef,
  })
}
