import { de, type CitationStyle } from '@litbase/shared'
import { Hono } from 'hono'
import { styles } from '../citation/styles'
import type { AppEnv } from '../types'

export const styleRoutes = new Hono<AppEnv>()
  .get('/', (c) => c.json(styles.listStyles() satisfies CitationStyle[]))
  /** CSL-XML eines Stils (für das Word-Add-in, das clientseitig formatiert). */
  .get('/:id', (c) => {
    const xml = styles.getStyleXml(c.req.param('id'))
    if (!xml) return c.json({ error: de.errors.unknownStyle }, 404)
    return c.body(xml, 200, { 'Content-Type': 'application/xml; charset=utf-8' })
  })
