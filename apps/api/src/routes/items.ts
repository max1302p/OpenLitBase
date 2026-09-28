import {
  addByIdentifierSchema,
  createItemSchema,
  de,
  itemListQuerySchema,
  updateItemSchema,
  type AddByIdentifierResult,
} from '@litbase/shared'
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { renderBibliography } from '../citation/format'
import { resolveStyleId } from '../citation/styles'
import { addByIdentifier } from '../items/add-by-identifier'
import {
  attachmentPathsForItems,
  deleteAttachmentFiles,
  MAX_ATTACHMENT_BYTES,
  saveAttachment,
} from '../items/attachments'
import {
  canEditItem,
  createItem,
  deleteItem,
  getItem,
  listItems,
  updateItem,
} from '../items/repository'
import { validate } from '../lib/validate'
import { canEdit, findProject } from '../projects/access'
import type { AppEnv } from '../types'
import { readOnly } from './projects'

const notFound = { error: de.errors.itemNotFound }

/** Neue Titel nur in Projekte mit Schreibrecht. */
async function canWriteTo(userId: string, projectId: string) {
  const project = await findProject(userId, projectId)
  return Boolean(project && canEdit(project.role))
}

export const itemRoutes = new Hono<AppEnv>()
  .get('/', validate('query', itemListQuerySchema), async (c) => {
    return c.json(await listItems(c.var.user.id, c.req.valid('query').projectId))
  })
  .post('/', validate('json', createItemSchema), async (c) => {
    const input = c.req.valid('json')
    if (!(await canWriteTo(c.var.user.id, input.projectId))) return c.json(readOnly, 403)
    const id = await createItem(c.var.user.id, input)
    return c.json(await getItem(c.var.user.id, id), 201)
  })
  .post('/identifier', validate('json', addByIdentifierSchema), async (c) => {
    const userId = c.var.user.id
    const { input, projectId } = c.req.valid('json')
    if (!(await canWriteTo(userId, projectId))) return c.json(readOnly, 403)
    const result = await addByIdentifier(userId, projectId, input)
    if ('error' in result) return c.json({ error: result.error }, result.status)
    return c.json(result satisfies AddByIdentifierResult, result.created ? 201 : 200)
  })
  .get('/:id', async (c) => {
    const item = await getItem(c.var.user.id, c.req.param('id'))
    return item ? c.json(item) : c.json(notFound, 404)
  })
  .get('/:id/formatted', async (c) => {
    const item = await getItem(c.var.user.id, c.req.param('id'))
    if (!item) return c.json(notFound, 404)
    const styleId = c.req.query('styleId') ?? (await resolveStyleId(c.var.user.id, c.req.query('projectId')))
    return c.json(renderBibliography(styleId, [item]))
  })
  .patch('/:id', validate('json', updateItemSchema), async (c) => {
    const ok = await updateItem(c.var.user.id, c.req.param('id'), c.req.valid('json'))
    if (ok) return c.json(await getItem(c.var.user.id, c.req.param('id')))
    return (await getItem(c.var.user.id, c.req.param('id'))) ? c.json(readOnly, 403) : c.json(notFound, 404)
  })
  .delete('/:id', async (c) => {
    const paths = await attachmentPathsForItems([c.req.param('id')])
    const ok = await deleteItem(c.var.user.id, c.req.param('id'))
    if (!ok) return c.json(notFound, 404)
    await deleteAttachmentFiles(paths)
    return c.body(null, 204)
  })
  .post(
    '/:id/attachments',
    bodyLimit({
      maxSize: MAX_ATTACHMENT_BYTES,
      onError: (c) => c.json({ error: de.errors.fileTooLarge }, 413),
    }),
    async (c) => {
      const item = await getItem(c.var.user.id, c.req.param('id'))
      if (!item) return c.json(notFound, 404)
      if (!(await canEditItem(c.var.user.id, item.id))) return c.json(readOnly, 403)
      const body = await c.req.parseBody()
      const file = body.file
      if (!(file instanceof File)) return c.json({ error: de.errors.noFile }, 400)
      try {
        await saveAttachment(item.id, file)
      } catch {
        return c.json({ error: de.errors.pdfOnly }, 400)
      }
      return c.json(await getItem(c.var.user.id, item.id), 201)
    },
  )
