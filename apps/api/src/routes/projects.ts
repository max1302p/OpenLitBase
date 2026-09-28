import {
  bibliographyExportFormats,
  createProjectSchema,
  de,
  formatDocumentSchema,
  projectItemsSchema,
  updateProjectSchema,
} from '@litbase/shared'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { renderDocument } from '../citation/document'
import { renderBibliography } from '../citation/format'
import { resolveStyleId, styleExists } from '../citation/styles'
import { db } from '../db/client'
import { projects } from '../db/schema'
import { bibliographyDocx, DOCX_MIME } from '../exports/docx'
import { formatExport } from '../exports/formats'
import { entryToMarkdown } from '../exports/html-inline'
import { deleteAttachmentFiles } from '../items/attachments'
import {
  addItemsToProject,
  deleteProject,
  getItemsByIds,
  listItems,
  removeItemFromProject,
} from '../items/repository'
import { download, safeFilename } from '../lib/download'
import { validate } from '../lib/validate'
import { canEdit, findProject } from '../projects/access'
import { listProjects, toProject } from '../projects/repository'
import type { AppEnv } from '../types'

const notFound = { error: de.errors.projectNotFound }
const unknownStyle = { error: de.errors.unknownStyle }
export const readOnly = { error: de.errors.readOnly, code: 'READ_ONLY' }
export const ownerOnly = { error: de.errors.ownerOnly, code: 'OWNER_ONLY' }

export const projectRoutes = new Hono<AppEnv>()
  .get('/', async (c) => c.json(await listProjects(c.var.user.id)))
  .post('/', validate('json', createProjectSchema), async (c) => {
    const input = c.req.valid('json')
    if (input.citationStyle && !styleExists(input.citationStyle)) return c.json(unknownStyle, 400)
    const [row] = await db
      .insert(projects)
      .values({ userId: c.var.user.id, name: input.name, citationStyle: input.citationStyle ?? null })
      .returning()
    return c.json(await toProject({ ...row!, role: 'owner' }), 201)
  })
  /** Name und Zitierstil: nur Besitzer:in; Forschungsdreisatz: alle mit Schreibrecht. */
  .patch('/:id', validate('json', updateProjectSchema), async (c) => {
    const input = c.req.valid('json')
    const project = await findProject(c.var.user.id, c.req.param('id'))
    if (!project) return c.json(notFound, 404)
    if (!canEdit(project.role)) return c.json(readOnly, 403)
    const { research, ...settings } = input
    if (Object.keys(settings).length > 0 && project.role !== 'owner') return c.json(ownerOnly, 403)
    if (settings.citationStyle && !styleExists(settings.citationStyle)) return c.json(unknownStyle, 400)
    const [row] = await db
      .update(projects)
      .set({ ...settings, ...(research && { research }) })
      .where(eq(projects.id, project.id))
      .returning()
    return c.json(await toProject({ ...row!, role: project.role }))
  })
  .delete('/:id', async (c) => {
    const files = await deleteProject(c.var.user.id, c.req.param('id'))
    if (!files) return c.json(ownerOnly, 403)
    await deleteAttachmentFiles(files)
    return c.body(null, 204)
  })
  .post('/:id/items', validate('json', projectItemsSchema), async (c) => {
    const ok = await addItemsToProject(c.var.user.id, c.req.param('id'), c.req.valid('json').itemIds)
    return ok ? c.body(null, 204) : c.json(readOnly, 403)
  })
  .delete('/:id/items/:itemId', async (c) => {
    const files = await removeItemFromProject(c.var.user.id, c.req.param('id'), c.req.param('itemId'))
    if (!files) return c.json(readOnly, 403)
    await deleteAttachmentFiles(files)
    return c.body(null, 204)
  })
  .get('/:id/bibliography', async (c) => {
    const userId = c.var.user.id
    const project = await findProject(userId, c.req.param('id'))
    if (!project) return c.json(notFound, 404)
    const styleId = await resolveStyleId(userId, project.id)
    return c.json(renderBibliography(styleId, await listItems(userId, project.id)))
  })
  /** Word-Add-in: alle Zitate des Dokuments im Stil des Projekts formatieren. */
  .post('/:id/format-document', validate('json', formatDocumentSchema), async (c) => {
    const userId = c.var.user.id
    const project = await findProject(userId, c.req.param('id'))
    if (!project) return c.json(notFound, 404)
    const { citations } = c.req.valid('json')
    const ids = [...new Set(citations.flatMap((citation) => citation.items.map((item) => item.id)))]
    const items = await getItemsByIds(userId, ids)
    return c.json(renderDocument(await resolveStyleId(userId, project.id), items, citations))
  })
  .get(
    '/:id/bibliography/export',
    validate('query', z.object({ format: z.enum(bibliographyExportFormats) })),
    async (c) => {
      const userId = c.var.user.id
      const project = await findProject(userId, c.req.param('id'))
      if (!project) return c.json(notFound, 404)
      const items = await listItems(userId, project.id)
      const name = safeFilename(`${de.bibliography.filePrefix} ${project.name}`)
      const format = c.req.valid('query').format

      if (format === 'bibtex') {
        return download(c, formatExport('bibtex', items), `${name}.bib`, 'application/x-bibtex; charset=utf-8')
      }
      const { entries } = renderBibliography(await resolveStyleId(userId, project.id), items)
      if (format === 'markdown') {
        const md = `# ${de.bibliography.title}\n\n${entries.map((e) => entryToMarkdown(e.html)).join('\n\n')}\n`
        return download(c, md, `${name}.md`, 'text/markdown; charset=utf-8')
      }
      const docx = await bibliographyDocx(de.bibliography.title, entries.map((e) => e.html))
      return download(c, docx, `${name}.docx`, DOCX_MIME)
    },
  )
