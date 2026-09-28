import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-client'

export function useConfig() {
  return useQuery({ queryKey: queryKeys.config, queryFn: api.getConfig, staleTime: Infinity })
}

export function useMe() {
  return useQuery({ queryKey: queryKeys.me, queryFn: api.getMe })
}
