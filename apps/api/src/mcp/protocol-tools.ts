import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { itemProtocolSchema, typeLabel } from '@litbase/shared'
import { z } from 'zod'
import { entryToMarkdown } from '../exports/html-inline'
import { canEdit, findProject } from '../projects/access'
import { getProtocol, saveItemProtocol } from '../protocol/repository'
import type { User } from '../types'
import { itemNotFound, ok, projectNotFound, readOnly } from './result'

/** Titelliste des Rechercheprotokolls (Spalten wie in der Vorlage). */
export function registerProtocolTools(server: McpServer, user: User) {
  server.registerTool(
    'get_protocol',
    {
      title: 'Rechercheprotokoll anzeigen',
      description:
        'Liste der recherchierten Titel im Rechercheprotokoll: Nummer und Eintrag wie im Literaturverzeichnis, ' +
        'Dokumenttyp sowie je Titel citation (Zitation im Text), keywords (Themeneinordnung, Schlüsselbegriffe) und ' +
        'suitability (fachliche Eignung für die Fragestellung).',
      inputSchema: { projectId: z.uuid() },
      annotations: { readOnlyHint: true },
    },
    async ({ projectId }) => {
      const project = await findProject(user.id, projectId)
      if (!project) return projectNotFound()
      const { entries } = await getProtocol(user.id, project.id)
      return ok(
        entries.map(({ itemId, number, reference, type, protocol }) => ({
          itemId,
          number,
          reference: entryToMarkdown(reference),
          type: typeLabel(type),
          ...protocol,
        })),
      )
    },
  )

  server.registerTool(
    'update_protocol_entry',
    {
      title: 'Rechercheprotokoll bearbeiten',
      description:
        'Setzt für einen Titel des Projekts citation, keywords und/oder suitability im Rechercheprotokoll. ' +
        'Nicht übergebene Felder bleiben, ein leerer Text leert das Feld.',
      inputSchema: { projectId: z.uuid(), itemId: z.uuid(), ...itemProtocolSchema.shape },
    },
    async ({ projectId, itemId, ...fields }) => {
      const project = await findProject(user.id, projectId)
      if (!project) return projectNotFound()
      if (!canEdit(project.role)) return readOnly()
      const { entries } = await getProtocol(user.id, project.id)
      const entry = entries.find((e) => e.itemId === itemId)
      if (!entry) return itemNotFound()
      const merged = Object.fromEntries(
        Object.entries({ ...entry.protocol, ...fields }).filter(([, value]) => value),
      )
      return ok(await saveItemProtocol(project.id, itemId, merged))
    },
  )
}
