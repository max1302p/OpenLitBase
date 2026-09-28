import { de, type ApiClient } from '@litbase/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { errorMessage } from '../lib/error-message'
import type { StoredCitation } from '../word/document-settings'
import { insertBibliography, insertCitation, refreshDocument, type FormatDocument } from '../word/document'

/** Zitieren, Verzeichnis einfügen und Aktualisieren – danach ist das Dokument immer durchnummeriert. */
export function useDocumentActions(api: ApiClient, projectId: string | undefined) {
  const queryClient = useQueryClient()
  const format: FormatDocument = (citations) => api.formatDocument(projectId!, { citations })
  const onError = (error: unknown) => toast.error(errorMessage(error))

  const cite = useMutation({
    mutationFn: async (citation: StoredCitation) => {
      await insertCitation(citation)
      return refreshDocument(format)
    },
    onSuccess: () => toast.success(de.addin.cited),
    onError,
  })

  const bibliography = useMutation({
    mutationFn: async () => {
      const inserted = await insertBibliography()
      await refreshDocument(format)
      return inserted
    },
    onSuccess: (inserted) => (inserted ? toast.success(de.addin.bibliographyInserted) : toast(de.addin.bibliographyExists)),
    onError,
  })

  // Lädt auch Projekte, Titel und Konto neu – Änderungen aus der Web-App erscheinen sofort.
  const refresh = useMutation({
    mutationFn: async () => {
      await queryClient.invalidateQueries()
      return refreshDocument(format)
    },
    onSuccess: (result) => toast.success(de.addin.refreshed(result.citations, result.entries)),
    onError,
  })

  const busy = cite.isPending || bibliography.isPending || refresh.isPending
  return { cite, bibliography, refresh, busy }
}
