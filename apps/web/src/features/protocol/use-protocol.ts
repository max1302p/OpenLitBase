import type { ItemProtocol, Protocol } from '@litbase/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import { queryKeys } from '@/lib/query-client'

/** Liegt unter `items`, damit neue/entfernte Titel das Protokoll automatisch neu laden. */
export function useProtocol(projectId: string) {
  return useQuery({ queryKey: queryKeys.protocol(projectId), queryFn: () => api.getProtocol(projectId) })
}

/** Felder eines Titels speichern und die Liste direkt aktualisieren (ohne Neuladen). */
export function useSaveItemProtocol(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, protocol }: { itemId: string; protocol: ItemProtocol }) =>
      api.saveItemProtocol(projectId, itemId, protocol),
    onSuccess: (protocol, { itemId }) =>
      queryClient.setQueryData<Protocol>(queryKeys.protocol(projectId), (current) =>
        current && { ...current, entries: current.entries.map((e) => (e.itemId === itemId ? { ...e, protocol } : e)) },
      ),
    onError: (error) => toast.error(errorMessage(error)),
  })
}

/** Ein Titel gilt als eingeordnet, sobald ein Feld ausgefüllt ist. */
export const isFilled = (protocol: ItemProtocol) => Boolean(protocol.citation || protocol.keywords || protocol.suitability)
