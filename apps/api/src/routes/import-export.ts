import { de, exportQuerySchema, importSchema, MAX_IMPORT_ZIP_BYTES } from '@litbase/shared'
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { z } from 'zod'
import { exportFileInfo, formatExport, parseImport } from '../exports/formats'
import { readZipImport } from '../exports/zip-import'
import { importEntries } from '../items/import'
import { listItems } from '../items/repository'
import { download } from '../lib/download'
import { validate } from '../lib/validate'
import { canEdit, findProject } from '../projects/access'
import type { AppEnv } from '../types'
import { readOnly } from './projects'

export const importExportRoutes = new Hono<AppEnv>()
  .post('/import', bodyLimit({ maxSize: 25 * 1024 * 1024 }), validate('json', importSchema), async (c) => {
    const userId = c.var.user.id
    const { format, content, projectId } = c.req.valid('json')
    const project = await findProject(userId, projectId)
    if (!project || !canEdit(project.role)) return c.json(readOnly, 403)
    let entries
    try {
      entries = parseImport(format, content)
    } catch {
      return c.json({ error: de.errors.importFailed }, 400)
    }
    return c.json(await importEntries(userId, projectId, entries))
  })
  /** Export-ZIP mit Literaturdatei und Anhängen (Citavi: Ordner `Attachments/`). */
  .post(
    '/import/zip',
    bodyLimit({ maxSize: MAX_IMPORT_ZIP_BYTES, onError: (c) => c.json({ error: de.errors.zipTooLarge }, 413) }),
    async (c) => {
      const userId = c.var.user.id
      const body = await c.req.parseBody()
      const projectId = z.uuid().safeParse(body.projectId)
      if (!projectId.success) return c.json({ error: de.errors.importFailed }, 400)
      if (!(body.file instanceof File)) return c.json({ error: de.errors.noFile }, 400)
      const project = await findProject(userId, projectId.data)
      if (!project || !canEdit(project.role)) return c.json(readOnly, 403)

      let zip, entries
      try {
        zip = readZipImport(new Uint8Array(await body.file.arrayBuffer()))
        if (!zip) return c.json({ error: de.errors.zipWithoutReferences }, 400)
        entries = parseImport(zip.format, zip.content)
      } catch {
        return c.json({ error: de.errors.importFailed }, 400)
      }
      return c.json(await importEntries(userId, projectId.data, entries, zip.findFile))
    },
  )
  .get('/export', validate('query', exportQuerySchema), async (c) => {
    const { format, projectId } = c.req.valid('query')
    const items = await listItems(c.var.user.id, projectId)
    const { ext, mime } = exportFileInfo[format]
    return download(c, formatExport(format, items), `litbase-export.${ext}`, mime)
  })
