import { Cite } from '@citation-js/core'
import '@citation-js/plugin-ris'
import type { CslItem } from '@litbase/shared'
import { parseDate, parseName, sanitizeCsl } from '../resolvers/csl-utils'
import type { ImportEntry } from './formats'

/** Typen, die citation-js nicht (richtig) kennt → Standard-RIS-Typ plus CSL-Genre. */
const TYPE_REWRITES: Record<string, { ris: string; genre?: string }> = {
  PRESS: { ris: 'GEN', genre: 'Pressemitteilung' },
  CourtDecision: { ris: 'CASE' },
}

type Tags = Map<string, string[]>

function readTags(record: string): Tags {
  const tags: Tags = new Map()
  for (const [, tag, value] of record.matchAll(/^([A-Z][A-Z0-9])  - ?(.*)$/gm)) {
    const trimmed = value!.trim()
    if (trimmed) tags.set(tag!, [...(tags.get(tag!) ?? []), trimmed])
  }
  return tags
}

/** RIS-Personen stehen als „Nachname, Vorname“; ohne Komma ist es eine Körperschaft. */
function risName(value: string) {
  return value.includes(',') ? parseName(value) : { literal: value }
}

function first(tags: Tags, ...keys: string[]) {
  return keys.map((k) => tags.get(k)?.[0]).find(Boolean)
}

/** Minimalzuordnung, falls citation-js einen Datensatz nicht versteht. */
function fallbackCsl(tags: Tags): Record<string, unknown> {
  return {
    type: 'document',
    title: first(tags, 'T1', 'TI', 'CT', 'BT'),
    author: (tags.get('AU') ?? tags.get('A1') ?? []).map(risName),
    issued: parseDate(first(tags, 'PY', 'Y1', 'DA')),
    'container-title': first(tags, 'T2', 'JF', 'JO'),
    publisher: first(tags, 'PB'),
    URL: first(tags, 'UR'),
    DOI: first(tags, 'DO'),
    abstract: first(tags, 'AB'),
  }
}

function parseRecord(record: string): Record<string, unknown> {
  const type = record.match(/^TY  - (\S+)/m)?.[1] ?? ''
  const rewrite = TYPE_REWRITES[type]
  const text = rewrite ? record.replace(/^TY  - \S+/m, `TY  - ${rewrite.ris}`) : record
  try {
    const [data] = new Cite(`${text.trim()}\nER  - \n`).data as Record<string, unknown>[]
    if (data?.title) return { ...data, ...(rewrite?.genre && { genre: rewrite.genre }) }
  } catch {
    // Fallback unten
  }
  return { ...fallbackCsl(readTags(record)), ...(rewrite?.genre && { genre: rewrite.genre }) }
}

/**
 * Citavi-Erweiterungen und -Abweichungen vom RIS-Standard ergänzen:
 * ED = Herausgeber (statt Auflage), T4 = Untertitel, Y2/Y3 = Zugriffsdatum, PM = PubMed-ID,
 * M3 = Art der Abschlussarbeit, IN = Institution, KW = Schlagwörter (→ Tags).
 */
function enrich(csl: Record<string, unknown>, tags: Tags) {
  const subtitle = first(tags, 'T4')
  if (subtitle && typeof csl.title === 'string' && !csl.title.includes(subtitle)) {
    csl.title = `${csl.title}: ${subtitle}`
  }
  // citation-js ordnet AU je nach Typ anders zu (z. B. NEWS, MPCT) und verliert es dabei.
  const authors = tags.get('AU') ?? tags.get('A1') ?? []
  if (authors.length > 0 && !csl.author) csl.author = authors.map(risName)
  const editors = (tags.get('ED') ?? []).filter((v) => /[A-Za-zÀ-ž]/.test(v) && !/^\d/.test(v))
  if (editors.length > 0 && !csl.editor) csl.editor = editors.map(risName)
  if (editors.length > 0 && typeof csl.edition === 'string' && editors.includes(csl.edition)) delete csl.edition

  // Bei Urteilen ist Y2 das Entscheidungsdatum und Y3 das Zugriffsdatum.
  if (csl.type === 'legal_case') {
    csl.issued ??= parseDate(first(tags, 'Y2'))
    csl.accessed = parseDate(first(tags, 'Y3'))
  } else if (!csl.accessed) {
    csl.accessed = parseDate(first(tags, 'Y2', 'Y3'))
  }
  const pmid = first(tags, 'PM')
  if (pmid) csl.PMID = pmid
  const thesisType = first(tags, 'M3')
  if (csl.type === 'thesis' && thesisType && !csl.genre) csl.genre = thesisType
  const institution = first(tags, 'IN')
  if (institution && !csl.publisher) csl.publisher = institution
  if (institution && !csl.author) csl.author = [{ literal: institution }]
  delete csl.keyword
}

/** RIS (inkl. Citavi-Export) → Einträge mit CSL, Tags und Anhang-Pfaden (L1). */
export function parseRis(content: string): ImportEntry[] {
  const records = content
    .replace(/^﻿/, '')
    .replace(/\r\n?/g, '\n')
    .split(/^ER  -.*$/m)
    .filter((r) => /^TY  - /m.test(r))

  return records.map((record) => {
    const tags = readTags(record)
    const csl = parseRecord(record)
    enrich(csl, tags)
    return {
      csl: sanitizeCsl(csl) as CslItem,
      tags: [...new Set(tags.get('KW') ?? [])],
      attachmentPaths: tags.get('L1') ?? [],
    }
  })
}
