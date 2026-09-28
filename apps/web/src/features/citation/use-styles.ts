import type { Settings } from '@litbase/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-client'

export function useStyles() {
  return useQuery({ queryKey: queryKeys.styles, queryFn: api.listStyles, staleTime: 5 * 60_000 })
}

export function useSettings() {
  return useQuery({ queryKey: queryKeys.settings, queryFn: api.getSettings })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Settings) => api.updateSettings(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings })
      await queryClient.invalidateQueries({ queryKey: queryKeys.items })
    },
  })
}

/** Anzeigename eines Stils (Fallback: ID). */
export function useStyleTitle(styleId: string | undefined) {
  const styles = useStyles()
  return styles.data?.find((s) => s.id === styleId)?.title ?? styleId ?? ''
}
