import { describe, expect, it } from 'vitest'
import { formatBibliography, formatDocument, type CslItem } from '../src'
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

describe('IEEE (Deutsch) wie Citavi „IEEE Editorial (German, As of 2024)“', () => {
  // Erwartete Texte aus der Stilvorschau von Citavi (Felder unverändert übernommen).
  const citavi: CslItem[] = [
    {
      id: 'contribution',
      type: 'chapter',
      title: 'Structuring your knowledge',
      author: [{ family: 'Twain', given: 'E.' }, { family: 'Singer', given: 'P.' }],
      'container-title': 'The art of writing',
      'collection-title': 'Scientific Publishing',
      'collection-number': '14',
      editor: [{ family: 'Frey', given: 'F.' }],
      edition: '2',
      publisher: 'Quickpress',
      'publisher-place': 'Sheffield',
      issued: { 'date-parts': [[2004]] },
      page: '88-170',
    },
    {
      id: 'book',
      type: 'book',
      title: 'Golden rules for writing well',
      author: [{ family: 'Sukowski', given: 'R. W.' }],
      edition: '2',
      publisher: 'University Press',
      'publisher-place': 'Toronto',
      issued: { 'date-parts': [[2009]] },
    },
    {
      id: 'article',
      type: 'article-journal',
      title: 'Citing is easy',
      author: [{ family: 'Brown', given: 'C.' }, { family: 'Trefil', given: 'J.' }, { family: 'Caringella', given: 'P.' }],
      'container-title': 'Style Review',
      volume: '24',
      issue: '2',
      page: '10-19',
      issued: { 'date-parts': [[2007]] },
      URL: 'http://www.writewell.edu/',
    },
    {
      id: 'chapter-without-publisher',
      type: 'chapter',
      title: 'Künstliche Intelligenz: Chance oder Risiko?',
      author: [{ family: 'Heim', given: 'Lars' }, { family: 'Gerth', given: 'Sebastian' }],
      'container-title': 'Entrepreneurship der Zukunft',
      editor: [{ family: 'Heim', given: 'Lars' }, { family: 'Gerth', given: 'Sebastian' }],
      issued: { 'date-parts': [[2023]] },
      page: '3-31',
    },
  ]

  it('formatiert Sammelbandbeitrag, Buch und Zeitschriftenartikel identisch', () => {
    const entries = formatBibliography({ ...base, items: citavi, format: 'text' })
    expect(entries.map((e) => e.text)).toEqual([
      '[1] E. Twain und P. Singer, "Structuring your knowledge," in The art of writing (Scientific Publishing 14), F. Frey, Hg., 2. Aufl. Sheffield: Quickpress, 2004, S. 88–170.',
      '[2] R. W. Sukowski, Golden rules for writing well, 2. Aufl. Toronto: University Press, 2009.',
      '[3] C. Brown, J. Trefil und P. Caringella, "Citing is easy," Style Review, Jg. 24, Nr. 2, S. 10–19, 2007. [Online]. Verfügbar unter: http://www.writewell.edu/',
      '[4] L. Heim und S. Gerth, "Künstliche Intelligenz: Chance oder Risiko?," in Entrepreneurship der Zukunft, L. Heim und S. Gerth, Hg., 2023, S. 3–31.',
    ])
  })

  it('setzt Sammelband- und Zeitschriftentitel kursiv', () => {
    const [chapter, , article] = formatBibliography({ ...base, items: citavi, format: 'html' })
    expect(chapter?.text).toContain('in <i>The art of writing</i> (Scientific Publishing 14)')
    expect(article?.text).toContain('<i>Style Review</i>, Jg. 24')
  })

  it('kürzt mehr als sechs Herausgeber:innen mit „et al.“ ab', () => {
    const editor = Array.from({ length: 7 }, (_, i) => ({ family: `Name${i}`, given: 'A.' }))
    const [entry] = formatBibliography({ ...base, items: [{ ...citavi[0]!, editor }], format: 'text' })
    expect(entry?.text).toContain('A. Name0 et al., Hg.')
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
