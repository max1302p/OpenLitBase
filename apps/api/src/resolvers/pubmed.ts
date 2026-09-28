import type { CslItem, CslName } from '@litbase/shared'
import { fetchJson } from '../lib/safe-fetch'
import { cleanText, parseDate, sanitizeCsl } from './csl-utils'

interface Summary {
  title?: string
  fulljournalname?: string
  source?: string
  volume?: string
  issue?: string
  pages?: string
  pubdate?: string
  authors?: { name: string; authtype: string }[]
  articleids?: { idtype: string; value: string }[]
}

/** PubMed-Namen haben die Form „LeCun Y“ (Nachname + Initialen). */
function pubmedName(name: string): CslName {
  const match = name.match(/^(.+?)\s+([A-Z]{1,4})$/)
  return match ? { family: match[1], given: match[2]!.split('').join('. ') + '.' } : { literal: name }
}

/** PubMed E-utilities (esummary). */
export async function resolvePmid(pmid: string): Promise<CslItem | undefined> {
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${pmid}`
  const data = await fetchJson<{ result?: Record<string, Summary> }>(url)
  const summary = data?.result?.[pmid]
  if (!summary?.title) return undefined

  return sanitizeCsl({
    type: 'article-journal',
    title: cleanText(summary.title).replace(/\.$/, ''),
    author: summary.authors?.filter((a) => a.authtype === 'Author').map((a) => pubmedName(a.name)),
    'container-title': summary.fulljournalname,
    'container-title-short': summary.source,
    volume: summary.volume,
    issue: summary.issue,
    page: summary.pages,
    issued: parseDate(summary.pubdate),
    DOI: summary.articleids?.find((a) => a.idtype === 'doi')?.value,
    PMID: pmid,
    PMCID: summary.articleids?.find((a) => a.idtype === 'pmc')?.value,
  })
}
