import { randomBytes } from 'node:crypto'
import { createApiTokenSchema, de, type ApiToken, type CreatedApiToken } from '@litbase/shared'
import { and, desc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../db/client'
import { apiTokens } from '../db/schema'
import { validate } from '../lib/validate'
import { hashToken } from '../middleware/auth'
import type { AppEnv } from '../types'

function toDto(row: typeof apiTokens.$inferSelect): ApiToken {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.createdAt.toISOString(),
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
  }
}

/** Persönliche API-Tokens für Extension und Add-in. Gespeichert wird nur der SHA-256-Hash. */
export const tokenRoutes = new Hono<AppEnv>()
  .get('/', async (c) => {
    const rows = await db
      .select()
      .from(apiTokens)
      .where(eq(apiTokens.userId, c.var.user.id))
      .orderBy(desc(apiTokens.createdAt))
    return c.json(rows.map(toDto))
  })
  .post('/', validate('json', createApiTokenSchema), async (c) => {
    const token = `olb_${randomBytes(32).toString('base64url')}`
    const [row] = await db
      .insert(apiTokens)
      .values({ userId: c.var.user.id, name: c.req.valid('json').name, tokenHash: hashToken(token) })
      .returning()
    return c.json({ ...toDto(row!), token } satisfies CreatedApiToken, 201)
  })
  .delete('/:id', async (c) => {
    const [row] = await db
      .delete(apiTokens)
      .where(and(eq(apiTokens.id, c.req.param('id')), eq(apiTokens.userId, c.var.user.id)))
      .returning({ id: apiTokens.id })
    return row ? c.body(null, 204) : c.json({ error: de.errors.tokenNotFound }, 404)
  })
