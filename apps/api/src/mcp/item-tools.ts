import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import {
  addByIdentifierSchema,
  createItemSchema,
  formatAuthors,
  getYear,
  itemTitle,
  updateItemSchema,
  type Item,
} from '@litbase/shared'
import { z } from 'zod'
import { renderBibliography } from '../citation/format'
import { resolveStyleId } from '../citation/styles'
import { addByIdentifier } from '../items/add-by-identifier'
import { createItem, getItem, listItems, updateItem } from '../items/repository'
import { canEdit, findProject } from '../projects/access'
import type { User } from '../types'
import { fail, itemNotFound, ok, projectNotFound, readOnly } from './result'

/** Kompakte Darstellung für Listen – die vollständigen CSL-Daten liefert `get_item`. */
function summary(item: Item) {
  return {
    id: item.id,
    type: item.csl.type,
    title: itemTitle(item.csl),
    authors: formatAuthors(item.csl),
    year: getYear(item.csl),
    doi: item.doi,
    isbn: item.isbn,
    url: item.url,
    tags: item.tags,
    hasNotes: Boolean(item.notes),
    attachments: item.attachments.length,
  }
}

/** Freitextsuche über Titel, Personen, Quelle, Kennungen, Tags und Notizen. */
function matches(item: Item, query: string) {
  const { csl } = item
  const people = [...(csl.author ?? []), ...(csl.editor ?? [])].map((n) => `${n.given ?? ''} ${n.family ?? ''} ${n.literal ?? ''}`)
  const haystack = [csl.title, csl['container-title'], ...people, item.doi, item.isbn, ...item.tags, item.notes]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase('de')
  return query
    .toLocaleLowerCase('de')
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word))
}

async function withFormatted(userId: string, item: Item, projectId?: string) {
  const { styleId, entries } = renderBibliography(await resolveStyleId(userId, projectId), [item])
  return { ...item, reference: { styleId, text: entries[0]?.text ?? '' } }
}

/** Fehler, wenn das Projekt fehlt oder nur gelesen werden darf. */
async function denyWrite(userId: string, projectId: string) {
  const project = await findProject(userId, projectId)
  if (!project) return projectNotFound()
  return canEdit(project.role) ? undefined : readOnly()
}

export function registerItemTools(server: McpServer, user: User) {
  server.registerTool(
    'search_items',
    {
      title: 'Titel suchen',
      description:
        'Listet die Titel eines Projekts (oder aller zugänglichen Projekte), optional gefiltert per Freitext ' +
        '(alle Wörter müssen vorkommen: Titel, Autor:innen, Zeitschrift, DOI/ISBN, Tags, Notizen).',
      inputSchema: {
        projectId: z.uuid().optional().describe('Projekt-ID aus list_projects; leer = alle Projekte'),
        query: z.string().max(500).optional(),
        limit: z.number().int().min(1).max(500).default(50),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ projectId, query, limit }) => {
      if (projectId && !(await findProject(user.id, projectId))) return projectNotFound()
      const all = await listItems(user.id, projectId)
      const found = query ? all.filter((item) => matches(item, query)) : all
      return ok({ total: found.length, items: found.slice(0, limit).map(summary) })
    },
  )

  server.registerTool(
    'get_item',
    {
      title: 'Titel anzeigen',
      description: 'Vollständiger Titel: CSL-JSON, Tags, Notizen, Anhänge und der formatierte Verzeichniseintrag.',
      inputSchema: {
        itemId: z.uuid(),
        projectId: z.uuid().optional().describe('Für den Zitierstil dieses Projekts'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ itemId, projectId }) => {
      const item = await getItem(user.id, itemId)
      return item ? ok(await withFormatted(user.id, item, projectId)) : itemNotFound()
    },
  )

  server.registerTool(
    'add_item_by_identifier',
    {
      title: 'Titel per DOI/ISBN/URL hinzufügen',
      description:
        'Löst DOI, ISBN, arXiv-ID, PubMed-ID oder URL über die Metadaten-Dienste auf und legt den Titel ins Projekt. ' +
        'Ist er schon vorhanden (gleiche DOI/ISBN oder Titel+Jahr), wird er nur zugeordnet (created = false).',
      inputSchema: {
        projectId: addByIdentifierSchema.shape.projectId,
        input: z.string().trim().min(1).max(2000).describe('z. B. 10.1145/3292500.3330701, 978-3-16-148410-0 oder eine URL'),
      },
      annotations: { openWorldHint: true },
    },
    async ({ projectId, input }) => {
      const denied = await denyWrite(user.id, projectId)
      if (denied) return denied
      const result = await addByIdentifier(user.id, projectId, input)
      if ('error' in result) return fail(result.error)
      return ok({ created: result.created, item: summary(result.item) })
    },
  )

  server.registerTool(
    'create_item',
    {
      title: 'Titel manuell anlegen',
      description:
        'Legt einen Titel aus CSL-JSON an (z. B. type "book", "article-journal", "webpage", "paper-conference", ' +
        '"thesis", "standard"; Namen als {family, given}, Datum als issued: {"date-parts": [[2024, 5]]}). ' +
        'Wenn es eine DOI, ISBN oder URL gibt, besser add_item_by_identifier nutzen.',
      inputSchema: createItemSchema.shape,
    },
    async (input) => {
      const denied = await denyWrite(user.id, input.projectId)
      if (denied) return denied
      const id = await createItem(user.id, input)
      return ok(summary((await getItem(user.id, id))!))
    },
  )

  server.registerTool(
    'update_item',
    {
      title: 'Titel bearbeiten',
      description:
        'Ändert CSL-JSON, Tags oder Notizen eines Titels. Übergebene Felder ersetzen die bisherigen vollständig ' +
        '(csl als ganzes Objekt, tags als ganze Liste) – vorher get_item aufrufen.',
      inputSchema: { itemId: z.uuid(), ...updateItemSchema.shape },
      annotations: { idempotentHint: true },
    },
    async ({ itemId, ...changes }) => {
      if (await updateItem(user.id, itemId, changes)) return ok(summary((await getItem(user.id, itemId))!))
      return (await getItem(user.id, itemId)) ? readOnly() : itemNotFound()
    },
  )
}
