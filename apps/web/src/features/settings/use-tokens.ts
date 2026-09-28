import type { CreateApiToken } from '@litbase/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

const key = ['tokens'] as const

export function useTokens() {
  return useQuery({ queryKey: key, queryFn: api.listTokens })
}

export function useCreateToken() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateApiToken) => api.createToken(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}

export function useDeleteToken() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteToken(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}
