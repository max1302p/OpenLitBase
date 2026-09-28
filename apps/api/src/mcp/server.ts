import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import type { User } from '../types'
import { readVersion } from '../version'
import { registerItemTools } from './item-tools'
import { registerProjectTools } from './project-tools'

const version = readVersion()

const instructions = `OpenLitBase ist eine Literaturverwaltung. Alles liegt in Projekten: zuerst list_projects aufrufen
und mit der Projekt-ID weiterarbeiten. Titel sind CSL-JSON. Neue Titel möglichst per add_item_by_identifier
(DOI, ISBN, arXiv, PMID, URL) anlegen, damit die Metadaten aus den Katalogen stammen. In Projekten mit der
Rolle "viewer" ist nur Lesen erlaubt.`

/**
 * MCP-Endpunkt für KI-Agenten (Streamable HTTP, zustandslos): pro Anfrage ein Server für den
 * angemeldeten User – Anmeldung und Rechte kommen wie bei allen API-Routen aus der Auth-Middleware
 * und `projects/access.ts`. Bewusst ohne Löschen.
 */
export async function handleMcpRequest(request: Request, user: User) {
  const server = new McpServer({ name: 'openlitbase', title: 'OpenLitBase', version }, { instructions })
  registerProjectTools(server, user)
  registerItemTools(server, user)
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
  await server.connect(transport)
  return transport.handleRequest(request)
}
