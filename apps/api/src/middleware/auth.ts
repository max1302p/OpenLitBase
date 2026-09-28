import { createHash } from 'node:crypto'
import { de } from '@litbase/shared'
import { eq } from 'drizzle-orm'
import { createMiddleware } from 'hono/factory'
import { hasAccess } from '../auth/access'
import { getAuth } from '../auth/better-auth'
import { LOCAL_USER_ID } from '../auth/local-user'
import { db } from '../db/client'
import { apiTokens, user } from '../db/schema'
import { env } from '../env'
import type { AppEnv, User } from '../types'

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

async function findUserById(id: string): Promise<User | undefined> {
  const [found] = await db.select().from(user).where(eq(user.id, id))
  return found
}

async function findUserByApiToken(token: string): Promise<User | undefined> {
  const [row] = await db
    .update(apiTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiTokens.tokenHash, hashToken(token)))
    .returning({ userId: apiTokens.userId })
  return row ? findUserById(row.userId) : undefined
}

async function resolveMultiUser(headers: Headers): Promise<User | undefined> {
  const bearer = headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (bearer) return findUserByApiToken(bearer)
  const session = await getAuth().api.getSession({ headers })
  return session ? findUserById(session.user.id) : undefined
}

/**
 * Die einzige Stelle, die AUTH_MODE kennt: setzt `c.var.user` oder antwortet mit 401.
 * - single: immer der implizite lokale User
 * - multi:  API-Token (Authorization: Bearer) oder better-auth-Session-Cookie
 */
export const requireUser = createMiddleware<AppEnv>(async (c, next) => {
  const current =
    env.AUTH_MODE === 'single'
      ? await findUserById(LOCAL_USER_ID)
      : await resolveMultiUser(c.req.raw.headers)
  if (!current) return c.json({ error: 'Nicht angemeldet' }, 401)
  // Institution deaktiviert → Konto gesperrt (gilt auch für API-Tokens von Extension/Add-in).
  if (!(await hasAccess(current.email))) return c.json({ error: de.errors.accountBlocked, code: 'ACCOUNT_BLOCKED' }, 403)
  c.set('user', current)
  await next()
})
