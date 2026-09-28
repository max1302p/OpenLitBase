import { describe, expect, it } from 'vitest'
import { buildSearchString, formatTerm, type TermMatrixData } from '../src'

const matrix: TermMatrixData = {
  columns: [
    {
      id: 'a',
      title: 'Künstliche Intelligenz',
      cells: {
        synonyms: [{ text: 'KI', truncate: false }],
        english: [{ text: 'artificial intelligence', truncate: false }, { text: 'AI', truncate: false }],
        opposite: [{ text: 'menschliche Intelligenz', truncate: false }],
      },
    },
    {
      id: 'b',
      title: 'Hochschule',
      cells: {
        narrower: [{ text: 'Universität', truncate: true }],
        english: [{ text: 'university', truncate: true }, { text: 'higher education', truncate: true }],
      },
    },
  ],
}

describe('formatTerm', () => {
  it.each([
    ['Bibliothek', false, 'Bibliothek'],
    ['Bibliothek', true, 'Bibliothek*'],
    ['machine learning', false, '"machine learning"'],
    ['machine learning', true, '"machine learning"'],
    ['  „Open  Access“ ', false, '"Open Access"'],
    ['learn*', true, 'learn*'],
    ['   ', false, ''],
  ])('%s (trunkiert: %s) → %s', (text, truncate, expected) => {
    expect(formatTerm(text, truncate)).toBe(expected)
  })
})

describe('buildSearchString', () => {
  it('verknüpft Spalten mit AND, Begriffe mit OR, ohne gegensätzliche Begriffe', () => {
    expect(buildSearchString(matrix)).toBe(
      '("Künstliche Intelligenz" OR KI OR "artificial intelligence" OR AI) AND (Hochschule OR Universität* OR university* OR "higher education")',
    )
  })

  it('nimmt nur die gewählten Zeilen', () => {
    expect(buildSearchString(matrix, ['english'])).toBe('("artificial intelligence" OR AI) AND (university* OR "higher education")')
    expect(buildSearchString(matrix, ['opposite'])).toBe('"menschliche Intelligenz"')
  })

  it('lässt leere Spalten weg und klammert einzelne Begriffe nicht', () => {
    expect(buildSearchString(matrix, ['synonyms', 'narrower'])).toBe('KI AND Universität*')
  })

  it('zählt doppelte Begriffe einmal', () => {
    const data: TermMatrixData = {
      columns: [{ id: 'x', title: 'KI', cells: { synonyms: [{ text: 'ki', truncate: false }, { text: 'AI', truncate: false }] } }],
    }
    expect(buildSearchString(data)).toBe('KI OR AI')
  })

  it('liefert einen leeren String ohne Begriffe', () => {
    expect(buildSearchString({ columns: [] })).toBe('')
    expect(buildSearchString({ columns: [{ id: 'x', title: '', cells: {} }] })).toBe('')
  })
})
