import type { CslItem } from '@litbase/shared'

const ARXIV_ID = /(?:arxiv\.org\/(?:abs|pdf)\/|10\.48550\/arxiv\.)(\d{4}\.\d{4,5}|[a-z-]+\/\d{7})/i

/**
 * arXiv-Preprints kommen aus Citavi & Co. als `misc`/„Unpublished Work“.
 * Einheitlich als `article` mit Herausgeber „arXiv“ und arXiv-Nummer ablegen.
 */
export function normalizeKnownSources(csl: CslItem): CslItem {
  const id = `${csl.DOI ?? ''} ${csl.URL ?? ''}`.match(ARXIV_ID)?.[1]?.replace(/v\d+$/, '')
  if (!id || !['document', 'manuscript', 'article'].includes(csl.type)) return csl
  return {
    ...csl,
    type: 'article',
    publisher: csl.publisher ?? 'arXiv',
    number: csl.number ?? `arXiv:${id}`,
    URL: csl.URL ?? `https://arxiv.org/abs/${id}`,
  }
}
