import { describe, expect, it } from 'vitest'
import { bookmarkletUrl, workFromBookmarklet } from '../src/bookmarklet'

const fragment = (values: Record<string, string>) => `#${new URLSearchParams(values)}`

describe('workFromBookmarklet', () => {
  it('nimmt den DOI aus den Metatags', () => {
    const meta = JSON.stringify({ citation_doi: 'https://doi.org/10.1038/nature14539', citation_title: 'Deep learning' })
    expect(workFromBookmarklet(fragment({ u: 'https://www.nature.com/articles/nature14539', t: 'Nature', s: '', m: meta }))).toEqual({
      input: '10.1038/nature14539',
      title: 'Deep learning',
      pageUrl: 'https://www.nature.com/articles/nature14539',
    })
  })

  it('bevorzugt eine markierte ISBN', () => {
    const work = workFromBookmarklet(fragment({ u: 'https://katalog.example.org/record/1', t: 'Katalog', s: ' 978-3-658-31979-3 ', m: '{}' }))
    expect(work?.input).toBe('9783658319793')
  })

  it('erkennt arXiv an der Adresse', () => {
    expect(workFromBookmarklet(fragment({ u: 'https://arxiv.org/abs/1706.03762', t: '', s: '', m: '{}' }))?.input).toBe('1706.03762')
  })

  it('fällt auf die Seiten-URL zurück und ignoriert fremde Metatags', () => {
    const meta = JSON.stringify({ description: '10.1000/xyz', 'og:title': 'Energiewende' })
    expect(workFromBookmarklet(fragment({ u: 'https://de.wikipedia.org/wiki/Energiewende', t: 'Wikipedia', s: '', m: meta }))).toEqual({
      input: 'https://de.wikipedia.org/wiki/Energiewende',
      title: 'Energiewende',
      pageUrl: 'https://de.wikipedia.org/wiki/Energiewende',
    })
  })

  it('lehnt fehlende oder fremde Adressen ab', () => {
    expect(workFromBookmarklet('')).toBeUndefined()
    expect(workFromBookmarklet(fragment({ u: 'javascript:alert(1)' }))).toBeUndefined()
  })
})

describe('bookmarkletUrl', () => {
  it('ist eine javascript:-Adresse mit der Server-Adresse', () => {
    const url = bookmarkletUrl('https://lit.example.com')
    expect(url.startsWith('javascript:')).toBe(true)
    const code = decodeURIComponent(url.slice('javascript:'.length))
    expect(code).toContain('"https://lit.example.com/add#"')
    expect(() => new Function(code)).not.toThrow()
  })
})
