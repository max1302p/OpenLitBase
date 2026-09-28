import { ApiError } from '@litbase/shared'
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2,
    },
  },
})

export const queryKeys = {
  config: ['config'] as const,
  me: ['me'] as const,
  projects: ['projects'] as const,
  items: ['items'] as const,
  itemList: (projectId?: string) => ['items', 'list', projectId ?? 'all'] as const,
  item: (id: string) => ['items', 'detail', id] as const,
  formatted: (id: string, styleId?: string) => ['items', 'formatted', id, styleId ?? 'default'] as const,
  bibliography: (projectId: string) => ['items', 'bibliography', projectId] as const,
  protocol: (projectId: string) => ['items', 'protocol', projectId] as const,
  termMatrix: (projectId: string) => ['term-matrix', projectId] as const,
  members: (projectId: string) => ['members', projectId] as const,
  styles: ['styles'] as const,
  settings: ['settings'] as const,
}
