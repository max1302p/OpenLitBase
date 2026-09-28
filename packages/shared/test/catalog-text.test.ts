import { describe, expect, it } from 'vitest'
import { cleanCatalogText } from '../src/catalog-text'

describe('cleanCatalogText', () => {
  it('entfernt MARC-Nichtsortierzeichen als Zeichenreferenz', () => {
    expect(
      cleanCatalogText('&#152;Die&#156; KI-Verordnung in der Praxis: Rechtliche Grundlagen und Pflichten bei der Anwendung von KI im Unternehmen'),
    ).toBe('Die KI-Verordnung in der Praxis: Rechtliche Grundlagen und Pflichten bei der Anwendung von KI im Unternehmen')
  })

  it('entfernt die Steuerzeichen selbst und MARC-8-Varianten', () => {
    expect(cleanCatalogText('\u0098Der\u009c Prozess')).toBe('Der Prozess')
    expect(cleanCatalogText('\u0088The\u0089 Book')).toBe('The Book')
    expect(cleanCatalogText('&lt;&lt;Die&gt;&gt; KI-Verordnung in der Praxis')).toBe('Die KI-Verordnung in der Praxis')
    expect(cleanCatalogText('<<Das>> Buch')).toBe('Das Buch')
  })

  it('löst Zeichenreferenzen auf und fasst Leerraum zusammen', () => {
    expect(cleanCatalogText('Forschung &amp; Lehre  &#x2013; ein&#160;Überblick')).toBe('Forschung & Lehre – ein Überblick')
  })
})
