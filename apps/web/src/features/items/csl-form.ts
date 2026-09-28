import { dateFields, nameFields, type CslDate, type CslItem, type ItemField, formatName } from '@litbase/shared'

export type FormValues = Partial<Record<ItemField, string>>

function nameToText(names: CslItem['author']) {
  return (names ?? []).map(formatName).join('; ')
}

/** „Müller, Anna; Schmid, Peter; Hochschule Musterstadt“ → CSL-Namen (ohne Komma = Körperschaft). */
function textToNames(text: string) {
  return text
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [family, ...given] = part.split(',')
      return given.length ? { family: family!.trim(), given: given.join(',').trim() } : { literal: part }
    })
}

function dateToText(date: CslDate | undefined) {
  const parts = date?.['date-parts']?.[0]
  if (!parts?.length) return date?.literal ?? date?.raw ?? ''
  return parts.map((p, i) => (i === 0 ? String(p) : String(p).padStart(2, '0'))).join('-')
}

function textToDate(text: string): CslDate | undefined {
  const match = text.trim().match(/^(\d{4})(?:-(\d{1,2}))?(?:-(\d{1,2}))?$/)
  if (!match) return text.trim() ? { literal: text.trim() } : undefined
  return { 'date-parts': [match.slice(1).filter(Boolean).map(Number)] }
}

const isNameField = (f: string) => (nameFields as readonly string[]).includes(f)
const isDateField = (f: string) => (dateFields as readonly string[]).includes(f)

export function cslToForm(csl: CslItem, fields: readonly ItemField[]): FormValues {
  const values: FormValues = {}
  for (const field of fields) {
    const value = csl[field]
    if (isNameField(field)) values[field] = nameToText(value as CslItem['author'])
    else if (isDateField(field)) values[field] = dateToText(value as CslDate | undefined)
    else values[field] = value == null ? '' : String(value)
  }
  return values
}

/** Formularwerte in ein bestehendes CSL-Objekt übernehmen (andere Felder bleiben erhalten). */
export function formToCsl(base: CslItem, values: FormValues): CslItem {
  const csl: Record<string, unknown> = { ...base }
  for (const [field, raw] of Object.entries(values)) {
    const text = raw?.trim() ?? ''
    const value = !text
      ? undefined
      : isNameField(field)
        ? textToNames(text)
        : isDateField(field)
          ? textToDate(text)
          : text
    if (value === undefined) delete csl[field]
    else csl[field] = value
  }
  return csl as CslItem
}
