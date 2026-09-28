import { de } from '@litbase/shared'
import { Hono } from 'hono'
import { deleteAttachment, findAttachment, openAttachment } from '../items/attachments'
import type { AppEnv } from '../types'

export const attachmentRoutes = new Hono<AppEnv>()
  /** Inline ausliefern, damit der PDF-Viewer des Browsers die Datei öffnet. */
  .get('/:id', async (c) => {
    const attachment = await findAttachment(c.var.user.id, c.req.param('id'))
    if (!attachment) return c.json({ error: de.errors.fileNotFound }, 404)
    const stream = await openAttachment(attachment.path)
    if (!stream) return c.json({ error: de.errors.fileNotFound }, 404)
    return new Response(stream, {
      headers: {
        'Content-Type': attachment.mime,
        'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(attachment.filename)}`,
      },
    })
  })
  .delete('/:id', async (c) => {
    const attachment = await findAttachment(c.var.user.id, c.req.param('id'), { edit: true })
    if (!attachment) return c.json({ error: de.errors.fileNotFound }, 404)
    await deleteAttachment(attachment.id, attachment.path)
    return c.body(null, 204)
  })
