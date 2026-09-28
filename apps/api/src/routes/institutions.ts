import { de, type Institution } from '@litbase/shared'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { logoUrl } from '../admin/logos'
import { listActiveDomains } from '../auth/domains'
import { db } from '../db/client'
import { allowedDomains } from '../db/schema'
import { env } from '../env'
import { storage } from '../storage'

/** Öffentlich: freigegebene Institutionen für die Login-/Registrierungsseite. */
export const institutionRoutes = new Hono()
  .get('/', async (c) => {
    const rows = env.AUTH_MODE === 'multi' ? await listActiveDomains() : []
    return c.json(
      rows.map((r) => ({ id: r.id, name: r.name, domain: r.domain, logoUrl: logoUrl(r.id, r.logoPath) })) satisfies Institution[],
    )
  })
  .get('/:id/logo', async (c) => {
    const [row] = await db
      .select({ logoPath: allowedDomains.logoPath })
      .from(allowedDomains)
      .where(and(eq(allowedDomains.id, c.req.param('id')), eq(allowedDomains.active, true)))
    const stream = row?.logoPath ? await storage.get(row.logoPath) : null
    if (!stream) return c.json({ error: de.errors.fileNotFound }, 404)
    return new Response(stream, {
      headers: {
        // Logos werden beim Upload immer in ein quadratisches PNG umgewandelt.
        'Content-Type': 'image/png',
        'Content-Security-Policy': "default-src 'none'",
        // Die URL enthält eine Version (?v=…), daher lange cachebar.
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  })
