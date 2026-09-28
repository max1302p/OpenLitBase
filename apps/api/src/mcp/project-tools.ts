import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import {
  buildSearchString,
  projectResearchSchema,
  termMatrixDataSchema,
  triadSentence,
} from '@litbase/shared'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { renderBibliography } from '../citation/format'
import { resolveStyleId } from '../citation/styles'
import { db } from '../db/client'
import { projects } from '../db/schema'
import { formatExport } from '../exports/formats'
import { entryToMarkdown } from '../exports/html-inline'
import { listItems } from '../items/repository'
import { canEdit, findProject } from '../projects/access'
import { listProjects } from '../projects/repository'
import { getTermMatrix, saveTermMatrix } from '../term-matrix/repository'
import type { User } from '../types'
import { ok, projectNotFound, readOnly } from './result'

export function registerProjectTools(server: McpServer, user: User) {
  server.registerTool(
    'list_projects',
    {
      title: 'Projekte auflisten',
      description: 'Alle eigenen und geteilten Projekte mit ID, Name, eigener Rolle (owner/editor/viewer) und Zitierstil.',
      annotations: { readOnlyHint: true },
    },
    async () => {
      const list = await listProjects(user.id)
      return ok(list.map(({ id, name, role, citationStyle, createdAt }) => ({ id, name, role, citationStyle, createdAt })))
    },
  )

  server.registerTool(
    'get_project',
    {
      title: 'Projekt anzeigen',
      description:
        'Projekt mit Forschungsdreisatz (Thema, Erkenntnisinteresse, Relevanz), Forschungsfrage, Begriffsmatrix ' +
        '(Spalten = Teilthemen, Zeilen synonyms/broader/narrower/related/opposite/english), daraus erzeugtem ' +
        'Suchstring und Anzahl Titel.',
      inputSchema: { projectId: z.uuid() },
      annotations: { readOnlyHint: true },
    },
    async ({ projectId }) => {
      const project = await findProject(user.id, projectId)
      if (!project) return projectNotFound()
      const [matrix, items, styleId] = await Promise.all([
        getTermMatrix(project.id),
        listItems(user.id, project.id),
        resolveStyleId(user.id, project.id),
      ])
      return ok({
        id: project.id,
        name: project.name,
        role: project.role,
        citationStyle: styleId,
        research: project.research,
        triad: triadSentence(project.research) || null,
        itemCount: items.length,
        termMatrix: matrix,
        searchString: buildSearchString(matrix),
      })
    },
  )

  server.registerTool(
    'update_research',
    {
      title: 'Forschungsdreisatz bearbeiten',
      description: 'Setzt Thema, Erkenntnisinteresse, Relevanz und/oder Forschungsfrage. Nicht übergebene Felder bleiben.',
      inputSchema: { projectId: z.uuid(), ...projectResearchSchema.shape },
      annotations: { idempotentHint: true },
    },
    async ({ projectId, ...changes }) => {
      const project = await findProject(user.id, projectId)
      if (!project) return projectNotFound()
      if (!canEdit(project.role)) return readOnly()
      const research = { ...project.research, ...changes }
      await db.update(projects).set({ research }).where(eq(projects.id, project.id))
      return ok({ research, triad: triadSentence(research) || null })
    },
  )

  server.registerTool(
    'update_term_matrix',
    {
      title: 'Begriffsmatrix speichern',
      description:
        'Ersetzt die ganze Begriffsmatrix des Projekts (vorher get_project lesen und ergänzen). Jede Spalte: ' +
        '{id, title, cells: {synonyms: [{text, truncate}], broader, narrower, related, opposite, english}}. ' +
        'truncate = Trunkierung mit * im Suchstring.',
      inputSchema: { projectId: z.uuid(), ...termMatrixDataSchema.shape },
      annotations: { idempotentHint: true },
    },
    async ({ projectId, columns }) => {
      const project = await findProject(user.id, projectId)
      if (!project) return projectNotFound()
      if (!canEdit(project.role)) return readOnly()
      const matrix = await saveTermMatrix(project.id, { columns })
      return ok({ termMatrix: matrix, searchString: buildSearchString(matrix) })
    },
  )

  server.registerTool(
    'get_bibliography',
    {
      title: 'Literaturverzeichnis',
      description:
        'Literaturverzeichnis des Projekts im Zitierstil des Projekts (alphabetisch; numerische Stile nummerieren ' +
        'in dieser Reihenfolge) als Text oder Markdown, oder alle Titel als BibTeX.',
      inputSchema: { projectId: z.uuid(), format: z.enum(['text', 'markdown', 'bibtex']).default('text') },
      annotations: { readOnlyHint: true },
    },
    async ({ projectId, format }) => {
      const project = await findProject(user.id, projectId)
      if (!project) return projectNotFound()
      const items = await listItems(user.id, project.id)
      if (format === 'bibtex') return ok(formatExport('bibtex', items))
      const { entries } = renderBibliography(await resolveStyleId(user.id, project.id), items)
      const lines = entries.map((entry) => (format === 'markdown' ? entryToMarkdown(entry.html) : entry.text))
      return ok(lines.join('\n\n'))
    },
  )
}
