import { de } from './de'
import type { CslItem, CslName } from './schemas'

export function formatName(name: CslName) {
  return name.literal ?? [name.family, name.given].filter(Boolean).join(', ')
}

/** „Müller, A.; Schmid, P. u. a.“ – kompakt für Tabellen. */
export function formatAuthors(csl: CslItem, max = 3) {
  const people = csl.author?.length ? csl.author : (csl.editor ?? [])
  const names = people.slice(0, max).map((p) => p.literal ?? p.family ?? '')
  return names.join('; ') + (people.length > max ? ' u. a.' : '')
}

export function getYear(csl: CslItem) {
  const year = csl.issued?.['date-parts']?.[0]?.[0]
  return year ? String(year) : (csl.issued?.literal ?? '')
}

export function typeLabel(type: string) {
  return de.itemTypes[type] ?? type
}

export function itemTitle(csl: CslItem) {
  return csl.title || de.items.untitled
}
