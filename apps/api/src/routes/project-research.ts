import {
  de,
  defaultSearchStringRows,
  itemProtocolSchema,
  protocolExportFormats,
  termMatrixDataSchema,
  termMatrixExportFormats,
  termMatrixRowKeys,
  type SearchStringRow,
} from '@litbase/shared'
import { Hono, type Context } from 'hono'
import { z } from 'zod'
import { protocolDocx, protocolMarkdown } from '../exports/protocol'
import { tableDocx, tableMarkdown, type TableExport } from '../exports/tables'
import { termMatrixTable } from '../exports/term-matrix'
import { DOCX_MIME } from '../exports/docx'
import { download, safeFilename } from '../lib/download'
import { validate } from '../lib/validate'
import { canEdit, findProject } from '../projects/access'
import { readOnly } from './projects'
import { getProtocol, saveItemProtocol } from '../protocol/repository'
import { getTermMatrix, saveTermMatrix } from '../term-matrix/repository'
import type { AppEnv } from '../types'

const notFound = { error: de.errors.projectNotFound }
const searchStringRows: readonly string[] = ['title', ...termMatrixRowKeys]

async function sendTable(c: Context, table: TableExport, name: string, format: string) {
  if (format === 'markdown') return download(c, tableMarkdown(table), `${name}.md`, 'text/markdown; charset=utf-8')
  return download(c, await tableDocx(table), `${name}.docx`, DOCX_MIME)
}

/** Begriffsmatrix und Rechercheprotokoll eines Projekts (gemountet unter `/api/projects/:id`). */
export const projectResearchRoutes = new Hono<AppEnv>()
  .get('/term-matrix', async (c) => {
    const project = await findProject(c.var.user.id, c.req.param('id')!)
    if (!project) return c.json(notFound, 404)
    return c.json(await getTermMatrix(project.id))
  })
  .put('/term-matrix', validate('json', termMatrixDataSchema), async (c) => {
    const project = await findProject(c.var.user.id, c.req.param('id')!)
    if (!project) return c.json(notFound, 404)
    if (!canEdit(project.role)) return c.json(readOnly, 403)
    return c.json(await saveTermMatrix(project.id, c.req.valid('json')))
  })
  .get(
    '/term-matrix/export',
    validate('query', z.object({ format: z.enum(termMatrixExportFormats), rows: z.string().optional() })),
    async (c) => {
      const project = await findProject(c.var.user.id, c.req.param('id')!)
      if (!project) return c.json(notFound, 404)
      const { format, rows } = c.req.valid('query')
      // Zeilen für den Suchstring wie in der Ansicht gewählt; unbekannte werden ignoriert.
      const selected = rows === undefined
        ? defaultSearchStringRows
        : rows.split(',').filter((r): r is SearchStringRow => searchStringRows.includes(r))
      const table = termMatrixTable(project.name, await getTermMatrix(project.id), selected)
      return sendTable(c, table, safeFilename(`${de.termMatrix.filePrefix} ${project.name}`), format)
    },
  )
  .get('/protocol', async (c) => {
    const project = await findProject(c.var.user.id, c.req.param('id')!)
    if (!project) return c.json(notFound, 404)
    const { bibliography: _, ...protocol } = await getProtocol(c.var.user.id, project.id)
    return c.json(protocol)
  })
  .put('/items/:itemId/protocol', validate('json', itemProtocolSchema), async (c) => {
    const project = await findProject(c.var.user.id, c.req.param('id')!)
    if (!project) return c.json(notFound, 404)
    if (!canEdit(project.role)) return c.json(readOnly, 403)
    const saved = await saveItemProtocol(project.id, c.req.param('itemId'), c.req.valid('json'))
    return saved ? c.json(saved) : c.json({ error: de.errors.itemNotFound }, 404)
  })
  /** Rechercheprotokoll wie die Vorlage: Dreisatz, Begriffsmatrix, Titelliste, Bibliografie. */
  .get('/protocol/export', validate('query', z.object({ format: z.enum(protocolExportFormats) })), async (c) => {
    const userId = c.var.user.id
    const project = await findProject(userId, c.req.param('id')!)
    if (!project) return c.json(notFound, 404)
    const protocol = await getProtocol(userId, project.id)
    const doc = {
      projectName: project.name,
      research: project.research,
      matrix: await getTermMatrix(project.id),
      titles: protocol.entries,
      bibliography: protocol.bibliography,
    }
    const name = safeFilename(`${de.protocol.filePrefix} ${project.name}`)
    if (c.req.valid('query').format === 'markdown') {
      return download(c, protocolMarkdown(doc), `${name}.md`, 'text/markdown; charset=utf-8')
    }
    return download(c, await protocolDocx(doc), `${name}.docx`, DOCX_MIME)
  })
