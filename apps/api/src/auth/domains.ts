import { and, asc, eq, inArray } from 'drizzle-orm'
import { db } from '../db/client'
import { allowedDomains } from '../db/schema'

/** „max@student.hochschule.ch“ → ["student.hochschule.ch", "hochschule.ch"] (Subdomains zählen zur freigegebenen Domain). */
export function domainCandidates(email: string) {
  const domain = email.split('@').pop()?.trim().toLowerCase() ?? ''
  const parts = domain.split('.').filter(Boolean)
  return parts.slice(0, -1).map((_, i) => parts.slice(i).join('.'))
}

export async function isEmailDomainAllowed(email: string) {
  const candidates = domainCandidates(email)
  if (candidates.length === 0) return false
  const [match] = await db
    .select({ id: allowedDomains.id })
    .from(allowedDomains)
    .where(and(eq(allowedDomains.active, true), inArray(allowedDomains.domain, candidates)))
  return Boolean(match)
}

/** Passende eingetragene Domain für eine E-Mail (spezifischste zuerst), unabhängig vom Status. */
export function matchDomain<T extends { domain: string }>(email: string, domains: T[]) {
  const candidates = domainCandidates(email)
  for (const candidate of candidates) {
    const match = domains.find((d) => d.domain === candidate)
    if (match) return match
  }
  return undefined
}

export function listActiveDomains() {
  return db.select().from(allowedDomains).where(eq(allowedDomains.active, true)).orderBy(asc(allowedDomains.name))
}
