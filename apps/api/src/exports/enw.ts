import { normalizeIsbn } from '@litbase/shared'
import { parseDate, parseName, sanitizeCsl } from '../resolvers/csl-utils'
import type { ImportEntry } from './formats'

/** EndNote-Referenztypen (%0) → CSL-Typen. */
const TYPES: Record<string, string> = {
  'journal article': 'article-journal',
  'electronic article': 'article-journal',
  'magazine article': 'article-magazine',
  'newspaper article': 'article-newspaper',
  book: 'book',
  'edited book': 'book',
  'electronic book': 'book',
  'book section': 'chapter',
  'conference paper': 'paper-conference',
  'conference proceedings': 'paper-conference',
  thesis: 'thesis',
  report: 'report',
  'web page': 'webpage',
  'unpublished work': 'manuscript',
  standard: 'standard',
  patent: 'patent',
  statute: 'legislation',
  case: 'legal_case',
  'computer program': 'software',
  dataset: 'dataset',
}

type Fields = Map<string, string[]>

function readRecord(record: string): Fields {
  const fields: Fields = new Map()
  for (const [, tag, value] of record.matchAll(/^%(\S)\s?(.*)$/gm)) {
    const trimmed = value!.trim()
    if (trimmed) fields.set(tag!, [...(fields.get(tag!) ?? []), trimmed])
  }
  return fields
}

const person = (value: string) => (value.includes(',') ? parseName(value) : { literal: value })

function toEntry(fields: Fields): ImportEntry {
  const get = (tag: string) => fields.get(tag)?.[0]
  const type = TYPES[get('0')?.toLowerCase() ?? ''] ?? 'document'
  // %@ enthält ISBN oder ISSN – eine gültige ISBN erkennt man an der Prüfziffer.
  const isbnOrIssn = get('@')
  const isbn = isbnOrIssn ? normalizeIsbn(isbnOrIssn) : undefined
  // Bei Büchern ist %P der Umfang („320“, „1 online resource“), sonst der Seitenbereich.
  const isBook = type === 'book'
  const container = type === 'chapter' || type === 'paper-conference' ? (get('B') ?? get('J')) : (get('J') ?? get('B'))

  const csl = sanitizeCsl({
    type,
    title: get('T'),
    author: (fields.get('A') ?? []).map(person),
    editor: [...(fields.get('E') ?? []), ...(fields.get('Y') ?? [])].map(person),
    'container-title': container,
    'collection-title': get('S'),
    issued: parseDate(get('D')),
    volume: get('V'),
    issue: get('N'),
    page: isBook ? undefined : get('P')?.replace(/\s*[–—]\s*/, '-'),
    'number-of-pages': isBook ? get('P')?.match(/^\d+$/)?.[0] : undefined,
    edition: get('7'),
    publisher: get('I'),
    'publisher-place': get('C'),
    genre: get('9'),
    ISBN: isbn ? isbnOrIssn : undefined,
    ISSN: isbn ? undefined : isbnOrIssn,
    DOI: get('R'),
    URL: get('U'),
    abstract: get('X'),
    language: get('G'),
  })
  return { csl, tags: [...new Set(fields.get('K') ?? [])], attachmentPaths: fields.get('>') ?? [] }
}

/** EndNote Tagged Import Format (.enw), wie es EndNote und Citavi exportieren. */
export function parseEndnote(content: string): ImportEntry[] {
  return content
    .replace(/^﻿/, '')
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n(?=%0 )/)
    .map(readRecord)
    .filter((fields) => fields.has('0'))
    .map(toEntry)
}
