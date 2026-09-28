// Minimale Typen für citeproc-js (das Paket bringt keine mit).
declare module 'citeproc' {
  interface CiteprocSys {
    retrieveLocale(lang: string): string | undefined
    retrieveItem(id: string): unknown
  }

  interface CitationInput {
    citationID: string
    citationItems: { id: string; locator?: string; label?: string }[]
    properties: { noteIndex: number }
  }

  interface BibliographyMeta {
    maxoffset: number
    entryspacing: number
    linespacing: number
    'second-field-align': false | 'flush' | 'margin'
    bibstart: string
    bibend: string
  }

  class Engine {
    constructor(sys: CiteprocSys, style: string, lang?: string, forceLang?: boolean)
    setOutputFormat(format: 'html' | 'text' | 'rtf'): void
    updateItems(ids: string[]): void
    makeBibliography(): false | [BibliographyMeta, string[]]
    rebuildProcessorState(
      citations: CitationInput[],
      mode?: 'html' | 'text' | 'rtf',
    ): [citationID: string, noteIndex: number, output: string][]
  }

  const CSL: { Engine: typeof Engine }
  export default CSL
}
