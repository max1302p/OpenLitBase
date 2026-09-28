import type { DocumentCitation } from '@litbase/shared'

/**
 * Zitatdaten liegen in den Dokument-Einstellungen (Office.js `document.settings`), das Content
 * Control trägt nur den Schlüssel im Tag. Grund: Tags sind kurz, Item-IDs und Seiten nicht.
 */
const CITATIONS_KEY = 'openlitbase.citations'
const PROJECT_KEY = 'openlitbase.project'

export type StoredCitation = Pick<DocumentCitation, 'items'>

function settings() {
  return Office.context.document.settings
}

function save() {
  return new Promise<void>((resolve, reject) => {
    settings().saveAsync((result) =>
      result.status === Office.AsyncResultStatus.Succeeded ? resolve() : reject(result.error),
    )
  })
}

export function readCitations(): Record<string, StoredCitation> {
  return (settings().get(CITATIONS_KEY) as Record<string, StoredCitation> | null) ?? {}
}

export function storeCitation(key: string, citation: StoredCitation) {
  settings().set(CITATIONS_KEY, { ...readCitations(), [key]: citation })
  return save()
}

/** Projekt, mit dem dieses Dokument zuletzt verbunden war. */
export function readDocumentProject() {
  return (settings().get(PROJECT_KEY) as string | null) ?? undefined
}

export function storeDocumentProject(projectId: string) {
  settings().set(PROJECT_KEY, projectId)
  return save()
}
