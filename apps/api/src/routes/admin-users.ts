import type { AdminUser, AdminUserStatus } from '@litbase/shared'
import { desc, max, ne } from 'drizzle-orm'
import { Hono } from 'hono'
import { isAdminEmail } from '../auth/access'
import { matchDomain } from '../auth/domains'
import { LOCAL_USER_ID } from '../auth/local-user'
import { db } from '../db/client'
import { allowedDomains, session, user } from '../db/schema'
import type { AppEnv } from '../types'

function statusOf(email: string, verified: boolean, domainActive: boolean | undefined): AdminUserStatus {
  if (isAdminEmail(email)) return 'admin'
  if (!domainActive) return 'blocked'
  return verified ? 'active' : 'unverified'
}

/** Alle Konten, nur lesend. Letzte Anmeldung = jüngste Session. */
export const adminUserRoutes = new Hono<AppEnv>().get('/', async (c) => {
  const [users, domains, lastSessions] = await Promise.all([
    db.select().from(user).where(ne(user.id, LOCAL_USER_ID)).orderBy(desc(user.createdAt)),
    db.select().from(allowedDomains),
    db.select({ userId: session.userId, last: max(session.createdAt) }).from(session).groupBy(session.userId),
  ])
  const lastByUser = new Map(lastSessions.map((s) => [s.userId, s.last]))

  return c.json(
    users.map((u) => {
      const domain = matchDomain(u.email, domains)
      const last = lastByUser.get(u.id)
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        institution: domain?.name ?? null,
        emailVerified: u.emailVerified,
        status: statusOf(u.email, u.emailVerified, domain?.active),
        createdAt: u.createdAt.toISOString(),
        lastSignInAt: last ? last.toISOString() : null,
      } satisfies AdminUser
    }),
  )
})
