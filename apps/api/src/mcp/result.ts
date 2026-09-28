import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { de } from '@litbase/shared'

/** Antwort als Text (Objekte als JSON) – so lesen alle MCP-Clients sie gleich. */
export function ok(value: unknown): CallToolResult {
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
  return { content: [{ type: 'text', text }] }
}

/** Fehler als Tool-Ergebnis: der Agent sieht die Meldung und kann reagieren. */
export function fail(message: string): CallToolResult {
  return { content: [{ type: 'text', text: message }], isError: true }
}

export const projectNotFound = () => fail(de.errors.projectNotFound)
export const itemNotFound = () => fail(de.errors.itemNotFound)
export const readOnly = () => fail(de.errors.readOnly)
