import type { AdminDomain } from '@litbase/shared'
import { asc } from 'drizzle-orm'
import { matchDomain } from '../auth/domains'
import { db } from '../db/client'
import { allowedDomains, user } from '../db/schema'
import { logoUrl } from './logos'

type DomainRow = typeof allowedDomains.$inferSelect

/** Konten pro Domain (Zuordnung wie bei der Anmeldung: spezifischste passende Domain). */
async function countUsers(domains: DomainRow[]) {
  const users = await db.select({ email: user.email }).from(user)
  const counts = new Map<string, number>()
  for (const { email } of users) {
    const match = matchDomain(email, domains)
    if (match) counts.set(match.id, (counts.get(match.id) ?? 0) + 1)
  }
  return counts
}

export async function listAdminDomains(): Promise<AdminDomain[]> {
  const rows = await db.select().from(allowedDomains).orderBy(asc(allowedDomains.name))
  const counts = await countUsers(rows)
  return rows.map((row) => ({
    id: row.id,
    domain: row.domain,
    name: row.name,
    active: row.active,
    logoUrl: logoUrl(row.id, row.logoPath),
    userCount: counts.get(row.id) ?? 0,
    createdAt: row.createdAt.toISOString(),
  }))
}

export async function getAdminDomain(id: string) {
  return (await listAdminDomains()).find((d) => d.id === id)
}
