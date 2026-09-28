import { describe, expect, it } from 'vitest'
import { detectIdentifier, normalizeIsbn } from '../src/identifiers'

describe('detectIdentifier', () => {
  it.each([
    ['10.1038/nature14539', { type: 'doi', value: '10.1038/nature14539' }],
    ['doi:10.1038/nature14539', { type: 'doi', value: '10.1038/nature14539' }],
    ['https://doi.org/10.1145/3386569.3392412', { type: 'doi', value: '10.1145/3386569.3392412' }],
    ['https://doi.org/10.1002/%28SICI%291097-4571', { type: 'doi', value: '10.1002/(SICI)1097-4571' }],
    ['(siehe 10.1000/xyz123).', { type: 'doi', value: '10.1000/xyz123' }],
    ['978-3-658-31979-3', { type: 'isbn', value: '9783658319793' }],
    ['ISBN 3-446-19313-8', { type: 'isbn', value: '9783446193130' }],
    ['0-306-40615-2', { type: 'isbn', value: '9780306406157' }],
    ['arXiv:1706.03762v7', { type: 'arxiv', value: '1706.03762' }],
    ['2101.00001', { type: 'arxiv', value: '2101.00001' }],
    ['hep-th/9901001', { type: 'arxiv', value: 'hep-th/9901001' }],
    ['https://arxiv.org/abs/1706.03762v5', { type: 'arxiv', value: '1706.03762' }],
    ['https://arxiv.org/pdf/1706.03762.pdf', { type: 'arxiv', value: '1706.03762' }],
    ['PMID: 26017442', { type: 'pmid', value: '26017442' }],
    ['26017442', { type: 'pmid', value: '26017442' }],
    ['https://pubmed.ncbi.nlm.nih.gov/26017442/', { type: 'pmid', value: '26017442' }],
    ['https://www.example.org/de/bibliothek', { type: 'url', value: 'https://www.example.org/de/bibliothek' }],
  ])('%s', (input, expected) => {
    expect(detectIdentifier(input)).toEqual(expected)
  })

  it.each(['', '   ', 'Deep learning', '978-3-658-31979-2', 'ftp://example.com'])(
    'erkennt „%s“ nicht',
    (input) => {
      expect(detectIdentifier(input)).toBeUndefined()
    },
  )
})

describe('normalizeIsbn', () => {
  it('akzeptiert X als Prüfziffer', () => {
    expect(normalizeIsbn('0-8044-2957-X')).toBe('9780804429573')
  })
})
