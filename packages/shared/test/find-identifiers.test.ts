import { describe, expect, it } from 'vitest'
import { detectPageWork, findIdentifiers, identifierFromUrl } from '../src/identifiers'

describe('findIdentifiers', () => {
  it('findet alle Arten im Fliesstext, sortiert nach Position', () => {
    const text =
      'Siehe 10.1038/nature14539. Buch: ISBN 978-3-658-31979-3, Preprint arXiv:1706.03762v7 und PMID: 26017442.'
    expect(findIdentifiers(text).map(({ type, value }) => ({ type, value }))).toEqual([
      { type: 'doi', value: '10.1038/nature14539' },
      { type: 'isbn', value: '9783658319793' },
      { type: 'arxiv', value: '1706.03762' },
      { type: 'pmid', value: '26017442' },
    ])
  })

  it('markiert den DOI ohne Satzzeichen am Ende', () => {
    const text = '(doi 10.1000/xyz123).'
    const [doi] = findIdentifiers(text)
    expect(text.slice(doi!.index, doi!.index + doi!.length)).toBe('10.1000/xyz123')
  })

  it('ignoriert Zahlen ohne Präfix und ungültige ISBNs', () => {
    expect(findIdentifiers('Seite 26017442, Jahr 2021, 978-3-658-31979-3, ISBN 978-3-658-31979-2')).toEqual([])
  })

  it('findet einen DOI in einer arXiv-DOI nur einmal', () => {
    expect(findIdentifiers('https://doi.org/10.48550/arXiv.1706.03762').map((f) => f.type)).toEqual(['doi'])
  })
})

describe('identifierFromUrl', () => {
  it.each([
    ['https://doi.org/10.1145/3386569.3392412', 'doi', '10.1145/3386569.3392412'],
    ['https://dx.doi.org/10.1002/%28SICI%291097-4571', 'doi', '10.1002/(SICI)1097-4571'],
    ['https://arxiv.org/abs/1706.03762v5', 'arxiv', '1706.03762'],
    ['https://pubmed.ncbi.nlm.nih.gov/26017442/', 'pmid', '26017442'],
  ])('%s', (href, type, value) => {
    expect(identifierFromUrl(href)).toEqual({ type, value })
  })

  it('liefert nichts für andere Links', () => {
    expect(identifierFromUrl('https://www.example.org/10.1000/abc')).toBeUndefined()
    expect(identifierFromUrl('kein Link')).toBeUndefined()
  })
})

describe('detectPageWork', () => {
  const url = 'https://link.springer.com/article/10.1007/s11192-021-04000-1'

  it('bevorzugt den DOI aus den Metatags und nimmt den Titel mit', () => {
    const meta = { citation_doi: 'doi:10.1007/s11192-021-04000-1', citation_isbn: '9783658319793', citation_title: 'Ein Artikel' }
    expect(detectPageWork(meta, url)).toEqual({ input: '10.1007/s11192-021-04000-1', title: 'Ein Artikel' })
  })

  it('nimmt ISBN, arXiv oder PMID aus den Metatags', () => {
    expect(detectPageWork({ citation_isbn: '978-3-658-31979-3' }, 'https://example.com')?.input).toBe('9783658319793')
    expect(detectPageWork({ citation_arxiv_id: '1706.03762' }, 'https://example.com')?.input).toBe('1706.03762')
  })

  it('erkennt DOI-, arXiv- und PubMed-Adressen', () => {
    expect(detectPageWork({}, url, 'Seitentitel')).toEqual({ input: '10.1007/s11192-021-04000-1', title: 'Seitentitel' })
    expect(detectPageWork({}, 'https://arxiv.org/abs/1706.03762v7')?.input).toBe('1706.03762')
    expect(detectPageWork({}, 'https://pubmed.ncbi.nlm.nih.gov/26017442/')?.input).toBe('26017442')
  })

  it('nimmt die URL bei Verlags-Metatags ohne Nummer', () => {
    const page = 'https://www.example.org/artikel/42'
    expect(detectPageWork({ citation_title: 'Ohne DOI' }, page)).toEqual({ input: page, title: 'Ohne DOI' })
  })

  it('zeigt auf gewöhnlichen Seiten nichts an', () => {
    expect(detectPageWork({ 'og:title': 'Nachrichten' }, 'https://www.example.org/news')).toBeUndefined()
    expect(detectPageWork({}, 'https://scholar.google.com/scholar?q=open+access')).toBeUndefined()
  })
})
