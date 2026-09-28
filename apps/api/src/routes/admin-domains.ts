import { de, domainInputSchema, updateDomainSchema } from '@litbase/shared'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { getAdminDomain, listAdminDomains } from '../admin/domains-repository'
import { deleteLogo, MAX_LOGO_BYTES, saveLogo } from '../admin/logos'
import { db } from '../db/client'
import { allowedDomains } from '../db/schema'
import { validate } from '../lib/validate'
import type { AppEnv } from '../types'

const notFound = { error: de.errors.domainNotFound }

async function findRow(id: string) {
  const [row] = await db.select().from(allowedDomains).where(eq(allowedDomains.id, id))
  return row
}

/** Postgres-Fehler 23505 = Unique-Verletzung (Domain doppelt). */
function isDuplicate(error: unknown) {
  return (error as { cause?: { code?: string } })?.cause?.code === '23505'
}

export const adminDomainRoutes = new Hono<AppEnv>()
  .get('/', async (c) => c.json(await listAdminDomains()))
  .post('/', validate('json', domainInputSchema), async (c) => {
    try {
      const [row] = await db.insert(allowedDomains).values(c.req.valid('json')).returning()
      return c.json(await getAdminDomain(row!.id), 201)
    } catch (error) {
      if (isDuplicate(error)) return c.json({ error: de.errors.domainExists }, 409)
      throw error
    }
  })
  .patch('/:id', validate('json', updateDomainSchema), async (c) => {
    try {
      const [row] = await db
        .update(allowedDomains)
        .set(c.req.valid('json'))
        .where(eq(allowedDomains.id, c.req.param('id')))
        .returning()
      return row ? c.json(await getAdminDomain(row.id)) : c.json(notFound, 404)
    } catch (error) {
      if (isDuplicate(error)) return c.json({ error: de.errors.domainExists }, 409)
      throw error
    }
  })
  .delete('/:id', async (c) => {
    const domain = await getAdminDomain(c.req.param('id'))
    if (!domain) return c.json(notFound, 404)
    if (domain.userCount > 0) return c.json({ error: de.errors.domainInUse(domain.userCount) }, 409)
    const row = await findRow(domain.id)
    await db.delete(allowedDomains).where(eq(allowedDomains.id, domain.id))
    await deleteLogo(row?.logoPath ?? null)
    return c.body(null, 204)
  })
  .post(
    '/:id/logo',
    bodyLimit({ maxSize: MAX_LOGO_BYTES + 64 * 1024, onError: (c) => c.json({ error: de.errors.logoInvalid }, 413) }),
    async (c) => {
      const row = await findRow(c.req.param('id'))
      if (!row) return c.json(notFound, 404)
      const file = (await c.req.parseBody()).file
      if (!(file instanceof File)) return c.json({ error: de.errors.noFile }, 400)
      const saved = await saveLogo(file)
      if (!saved.ok) return c.json({ error: saved.error }, 400)
      await db.update(allowedDomains).set({ logoPath: saved.path }).where(eq(allowedDomains.id, row.id))
      await deleteLogo(row.logoPath)
      return c.json(await getAdminDomain(row.id))
    },
  )
  .delete('/:id/logo', async (c) => {
    const row = await findRow(c.req.param('id'))
    if (!row) return c.json(notFound, 404)
    await db.update(allowedDomains).set({ logoPath: null }).where(eq(allowedDomains.id, row.id))
    await deleteLogo(row.logoPath)
    return c.json(await getAdminDomain(row.id))
  })
