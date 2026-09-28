import { describe, expect, it } from 'vitest'
import { formatBibliography, formatDocument } from '../src'
import { BUILTIN_STYLES_DIR, createStyleRegistry } from '../src/node'
import { fixtures } from './fixtures'

const registry = createStyleRegistry([BUILTIN_STYLES_DIR])
const styleXml = registry.getStyleXml('ieee-de')!
const base = { styleXml, loadLocale: registry.loadLocale, items: fixtures }

describe('IEEE (Deutsch)', () => {
  it('formatiert Buch, Artikel, Konferenzbeitrag, Webseite, Norm, Preprint und Abschlussarbeit', () => {
    const entries = formatBibliography({ ...base, format: 'text' })
    expect(entries.map((e) => e.text)).toMatchSnapshot()
  })

  it('setzt Titel in HTML kursiv', () => {
    const [book] = formatBibliography({ ...base, items: [fixtures[0]!], format: 'html' })
    expect(book?.text).toContain('<i>Grundlagen der Informatik</i>')
  })

  it('nummeriert nach erster Zitation, fasst Bereiche zusammen und zeigt Seitenangaben', () => {
    const doc = formatDocument({
      ...base,
      format: 'text',
      citations: [
        { id: 'c1', items: [{ id: 'article' }] },
        { id: 'c2', items: [{ id: 'book', locator: '12', label: 'page' }] },
        { id: 'c3', items: [{ id: 'article' }, { id: 'book' }, { id: 'conference' }] },
        { id: 'c4', items: [{ id: 'thesis' }] },
      ],
    })
    expect(doc.citations.map((c) => c.text)).toEqual(['[1]', '[2, S. 12]', '[1]–[3]', '[4]'])
    expect(doc.bibliography.map((e) => e.id)).toEqual(['article', 'book', 'conference', 'thesis'])
  })
})

describe('Style-Registry', () => {
  it('findet alle mitgelieferten Styles', () => {
    const ids = registry.listStyles().map((s) => s.id)
    expect(ids).toEqual(expect.arrayContaining(['ieee-de', 'ieee', 'apa', 'din-1505-2']))
  })

  it('lehnt ungültige Style-IDs ab', () => {
    expect(registry.getStyleXml('../../etc/passwd')).toBeUndefined()
  })
})
