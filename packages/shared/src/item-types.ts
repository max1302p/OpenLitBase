/** CSL-Typen, die das manuelle Formular anbietet, mit ihren Feldern (Reihenfolge = Anzeige). */
export const manualItemTypes = {
  book: ['title', 'author', 'editor', 'edition', 'publisher', 'publisher-place', 'issued', 'ISBN', 'URL'],
  'article-journal': ['title', 'author', 'container-title', 'volume', 'issue', 'page', 'issued', 'DOI', 'URL'],
  webpage: ['title', 'author', 'container-title', 'issued', 'URL', 'accessed'],
  'paper-conference': [
    'title', 'author', 'container-title', 'editor', 'event', 'publisher', 'publisher-place',
    'page', 'issued', 'DOI', 'URL',
  ],
  standard: ['title', 'author', 'genre', 'number', 'publisher', 'publisher-place', 'issued', 'URL'],
  thesis: ['title', 'author', 'genre', 'publisher', 'publisher-place', 'issued', 'URL'],
} as const satisfies Record<string, readonly string[]>

export type ManualItemType = keyof typeof manualItemTypes
export type ItemField = (typeof manualItemTypes)[ManualItemType][number]

/** Alle Felder, die in Formularen vorkommen. */
export const itemFields = [...new Set(Object.values(manualItemTypes).flat())] as ItemField[]

export const nameFields = ['author', 'editor'] as const satisfies readonly ItemField[]
export const dateFields = ['issued', 'accessed'] as const satisfies readonly ItemField[]
