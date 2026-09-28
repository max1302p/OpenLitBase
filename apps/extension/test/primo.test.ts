import { describe, expect, it } from 'vitest'
import { pnxToWork, primoRecordFromUrl } from '../src/lib/primo'

describe('primoRecordFromUrl', () => {
  it('erkennt Primo-Detailseiten', () => {
    const href =
      'https://katalog.example.org/discovery/fulldisplay?docid=alma99117350228705515&context=L&vid=41SLSP_ABC:VU1&lang=de&tab=x'
    expect(primoRecordFromUrl(href)).toEqual({
      origin: 'https://katalog.example.org',
      docid: 'alma99117350228705515',
      vid: '41SLSP_ABC:VU1',
      context: 'L',
      lang: 'de',
    })
  })

  it('ignoriert Such- und andere Seiten', () => {
    expect(primoRecordFromUrl('https://katalog.example.org/discovery/search?query=any,contains,KI&vid=X')).toBeUndefined()
    expect(primoRecordFromUrl('https://www.example.org/discovery/fulldisplay')).toBeUndefined()
  })
})

describe('pnxToWork', () => {
  const book = {
    addata: {
      btitle: ['Generative KI für Dummies®'],
      au: ['Baker, Pam'],
      addau: ['Muhr, Judith'],
      date: ['2025'],
      isbn: ['9783527722877', '9783527851256'],
      pub: ['Wiley-VCH GmbH'],
      ristype: ['BOOK'],
    },
  }

  it('nimmt DOI vor ISBN', () => {
    expect(pnxToWork({ addata: { ...book.addata, doi: ['10.1000/xyz123'] } })).toEqual({ input: '10.1000/xyz123', title: 'Generative KI für Dummies®' })
  })

  it('nimmt die erste gültige ISBN', () => {
    expect(pnxToWork(book)).toEqual({ input: '9783527722877', title: 'Generative KI für Dummies®' })
  })

  it('baut ohne DOI/ISBN einen Titel aus den Katalogdaten', () => {
    const work = pnxToWork({
      addata: {
        btitle: ['Informationskompetenz im Studium'],
        au: ['Keller, Lea, 1985-', 'Hochschule Musterstadt'],
        date: ['2019'],
        pub: ['Eigenverlag'],
        cop: ['Musterstadt'],
        ristype: ['THES'],
      },
    })
    expect(work?.csl).toEqual({
      type: 'thesis',
      title: 'Informationskompetenz im Studium',
      author: [{ family: 'Keller', given: 'Lea' }, { literal: 'Hochschule Musterstadt' }],
      issued: { 'date-parts': [[2019]] },
      publisher: 'Eigenverlag',
      'publisher-place': 'Musterstadt',
    })
  })

  it('liefert nichts ohne Titel', () => {
    expect(pnxToWork({ addata: {} })).toBeUndefined()
  })
})

describe('pnxToWork – Katalogtext', () => {
  it('entfernt Nichtsortierzeichen im Titel', () => {
    const work = pnxToWork({ addata: { btitle: ['&#152;Die&#156; KI-Verordnung in der Praxis'], isbn: ['9783527722877'] } })
    expect(work?.title).toBe('Die KI-Verordnung in der Praxis')
  })
})
