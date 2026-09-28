import type { CslItem } from '@litbase/shared'
import { fetchJson, fetchText } from '../lib/safe-fetch'
import { parseDate, parseName, sanitizeCsl } from './csl-utils'
import { sruResponseToCsl } from './marc'

async function fromDnb(isbn: string) {
  const url = `https://services.dnb.de/sru/dnb?version=1.1&operation=searchRetrieve&query=num%3D${isbn}&recordSchema=MARC21-xml`
  const xml = await fetchText(url)
  return xml ? sruResponseToCsl(xml) : undefined
}

async function fromSwisscovery(isbn: string) {
  const url = `https://swisscovery.slsp.ch/view/sru/41SLSP_NETWORK?version=1.2&operation=searchRetrieve&recordSchema=marcxml&maximumRecords=1&query=alma.isbn%3D${isbn}`
  const xml = await fetchText(url)
  return xml ? sruResponseToCsl(xml) : undefined
}

interface OpenLibraryBook {
  title?: string
  subtitle?: string
  authors?: { name: string }[]
  publishers?: { name: string }[]
  publish_places?: { name: string }[]
  publish_date?: string
  number_of_pages?: number
  url?: string
}

async function fromOpenLibrary(isbn: string) {
  const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
  const book = (await fetchJson<Record<string, OpenLibraryBook>>(url))?.[`ISBN:${isbn}`]
  if (!book?.title) return undefined
  return sanitizeCsl({
    type: 'book',
    title: book.subtitle ? `${book.title}: ${book.subtitle}` : book.title,
    author: book.authors?.map((a) => parseName(a.name)),
    publisher: book.publishers?.[0]?.name,
    'publisher-place': book.publish_places?.[0]?.name,
    issued: parseDate(book.publish_date),
    'number-of-pages': book.number_of_pages ? String(book.number_of_pages) : undefined,
  })
}

/** ISBN (13-stellig, normalisiert): DNB → swisscovery → OpenLibrary. */
export async function resolveIsbn(isbn: string): Promise<CslItem | undefined> {
  const csl = (await fromDnb(isbn)) ?? (await fromSwisscovery(isbn)) ?? (await fromOpenLibrary(isbn))
  return csl ? { ...csl, ISBN: isbn } : undefined
}
