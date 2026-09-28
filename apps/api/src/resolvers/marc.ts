import { cleanCatalogText, type CslItem, type CslName } from '@litbase/shared'
import { parseName, sanitizeCsl } from './csl-utils'
import { findAll, parseXml, text } from './xml'

interface Field {
  tag: string
  ind2: string
  subfields: { code: string; value: string }[]
}

function readFields(record: Record<string, unknown>): Field[] {
  const datafields = (record.datafield ?? []) as Record<string, unknown>[]
  return datafields.map((df) => ({
    tag: String(df['@tag']),
    ind2: String(df['@ind2'] ?? ' '),
    subfields: ((df.subfield ?? []) as unknown[]).map((sf) => ({
      code: String((sf as Record<string, unknown>)['@code']),
      value: text(sf) ?? '',
    })),
  }))
}

/**
 * Zeichenreferenzen und Nichtsortierzeichen entfernen, dann MARC-Interpunktion am Ende
 * („Titel :“, „Berlin ;“, „[2021]“).
 */
function clean(value: string | undefined) {
  return value && (cleanCatalogText(value).replace(/[\s/:;,=]+$/, '').replace(/^\[|\]$/g, '').trim() || undefined)
}

function sub(fields: Field[], tag: string, code: string, ind2?: string) {
  const field = fields.find((f) => f.tag === tag && (ind2 === undefined || f.ind2 === ind2))
  return clean(field?.subfields.find((s) => s.code === code)?.value)
}

function names(fields: Field[], role: 'aut' | 'edt'): CslName[] {
  return fields
    .filter((f) => ['100', '110', '700', '710'].includes(f.tag))
    .filter((f) => {
      // Rolle aus Code ($4, z. B. „edt“) oder Klartext ($e, z. B. „editor.“, „Herausgeber“).
      const relators = f.subfields
        .filter((s) => s.code === '4' || s.code === 'e')
        .map((s) => s.value.toLowerCase())
      const isEditor = relators.some((r) => r === 'edt' || /^(editor|herausgeber|hrsg)/.test(r))
      const isAuthor = relators.some((r) => r === 'aut' || /^(author|verfasser)/.test(r))
      if (role === 'edt') return isEditor
      if (isEditor) return false
      return isAuthor || relators.length === 0
    })
    .map((f) => {
      const name = f.subfields.find((s) => s.code === 'a')?.value ?? ''
      return f.tag.endsWith('10') ? { literal: clean(name)! } : parseName(name)
    })
    .filter((n) => n.literal || n.family)
}

/** MARC21-Record (DNB, swisscovery) → CSL-JSON (Buch bzw. Abschlussarbeit). */
function marcRecordToCsl(record: Record<string, unknown>): CslItem | undefined {
  const fields = readFields(record)
  const title = sub(fields, '245', 'a')
  if (!title) return undefined
  const subtitle = sub(fields, '245', 'b')
  const pub = fields.some((f) => f.tag === '264' && f.ind2 === '1') ? ['264', '1'] : ['260', undefined]
  const year = sub(fields, pub[0]!, 'c', pub[1])?.match(/\d{4}/)?.[0]
  const edition = sub(fields, '250', 'a')
  const editionNumber = edition?.match(/^(\d+)/)?.[1]
  const doi = fields.find((f) => f.tag === '024' && f.subfields.some((s) => s.value === 'doi'))

  return sanitizeCsl({
    type: fields.some((f) => f.tag === '502') ? 'thesis' : 'book',
    title: subtitle ? `${title}: ${subtitle}` : title,
    author: names(fields, 'aut'),
    editor: names(fields, 'edt'),
    edition: editionNumber ?? edition,
    publisher: sub(fields, pub[0]!, 'b', pub[1]),
    'publisher-place': sub(fields, pub[0]!, 'a', pub[1]),
    issued: year ? { 'date-parts': [[Number(year)]] } : undefined,
    ISBN: sub(fields, '020', 'a'),
    DOI: doi?.subfields.find((s) => s.code === 'a')?.value,
    'collection-title': sub(fields, '490', 'a'),
    'collection-number': sub(fields, '490', 'v'),
    'number-of-pages': sub(fields, '300', 'a'),
    genre: sub(fields, '502', 'b') ?? sub(fields, '502', 'a'),
  })
}

/** Erstes brauchbares MARC-Record aus einer SRU-Antwort. */
export function sruResponseToCsl(xml: string): CslItem | undefined {
  const records = findAll(parseXml(xml), 'datafield')
  for (const record of records) {
    const csl = marcRecordToCsl(record)
    if (csl) return csl
  }
  return undefined
}
