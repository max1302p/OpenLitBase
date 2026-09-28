import { describe, expect, it } from 'vitest'
import { formatBibliography, formatDocument } from '../src'
import { BUILTIN_STYLES_DIR, createStyleRegistry } from '../src/node'
import { fixtures } from './fixtures'

const registry = createStyleRegistry([BUILTIN_STYLES_DIR])
const styleXml = registry.getStyleXml('ieee-de-seite')!
const base = { styleXml, loadLocale: registry.loadLocale, items: fixtures }

describe('IEEE (Deutsch, Seite im Verzeichnis)', () => {
  it('formatiert alle Typen nach Merkblatt', () => {
    const entries = formatBibliography({ ...base, format: 'text' })
    expect(entries.map((e) => e.text)).toMatchSnapshot()
  })

  it('setzt Seiten ins Verzeichnis und nummeriert Titel mit anderer Seite neu', () => {
    const doc = formatDocument({
      ...base,
      format: 'text',
      citations: [
        { id: 'c1', items: [{ id: 'book', locator: '12', label: 'page' }] },
        { id: 'c2', items: [{ id: 'article' }] },
        { id: 'c3', items: [{ id: 'book', locator: '12', label: 'page' }] },
        { id: 'c4', items: [{ id: 'book', locator: '40', label: 'page' }] },
      ],
    })
    expect(doc.citations.map((c) => c.text)).toEqual(['[1]', '[2]', '[1]', '[3]'])
    const texts = doc.bibliography.map((e) => e.text)
    expect(texts[0]).toMatch(/^\[1\] .*, 2021, S\. 12\.$/)
    expect(texts[2]).toMatch(/^\[3\] .*, 2021, S\. 40\.$/)
  })

  it('setzt die Seite vor DOI und URL', () => {
    const doc = formatDocument({
      ...base,
      format: 'text',
      citations: [
        { id: 'c1', items: [{ id: 'article', locator: '440', label: 'page' }] },
        { id: 'c2', items: [{ id: 'webpage', locator: '3', label: 'page' }] },
      ],
    })
    const [article, webpage] = doc.bibliography.map((e) => e.text)
    expect(article).toMatch(/Mai 2015, S\. 440\. doi: 10\.1038\/nature14539\.$/)
    expect(webpage).toMatch(/Musterstadt, S\. 3\. \[Online\] Available: /)
  })

  it('hängt die Seite auch in HTML vor den schliessenden Tags an', () => {
    const doc = formatDocument({
      ...base,
      format: 'html',
      citations: [{ id: 'c1', items: [{ id: 'book', locator: '12', label: 'page' }] }],
    })
    expect(doc.bibliography[0]?.text).toMatch(/2021, S\. 12\.<\/div>\s*<\/div>$/)
  })
})

describe('Erstauflage', () => {
  it('lässt „1. Aufl.“ in allen Stilen weg', () => {
    const book = { ...fixtures[0]!, edition: '1' }
    for (const id of ['ieee-de', 'ieee-de-seite']) {
      const [entry] = formatBibliography({ ...base, styleXml: registry.getStyleXml(id)!, items: [book], format: 'text' })
      expect(entry?.text).not.toMatch(/Aufl/)
    }
  })
})
