import type { CslItem, Identifier } from '@litbase/shared'
import { resolveArxiv } from './arxiv'
import { resolveDoi } from './doi'
import { resolveIsbn } from './isbn'
import { resolvePmid } from './pubmed'
import { resolveUrl } from './url'

const resolvers: Record<Identifier['type'], (value: string) => Promise<CslItem | undefined>> = {
  doi: resolveDoi,
  isbn: resolveIsbn,
  arxiv: resolveArxiv,
  pmid: resolvePmid,
  url: resolveUrl,
}

/** Metadaten zu einem erkannten Identifier als CSL-JSON; undefined, wenn keine Quelle etwas findet. */
export async function resolveIdentifier({ type, value }: Identifier): Promise<CslItem | undefined> {
  try {
    return await resolvers[type](value)
  } catch (error) {
    console.warn(`Resolver ${type} fehlgeschlagen für ${value}:`, error)
    return undefined
  }
}
