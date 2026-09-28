import type { DomainInput, UpdateDomain } from '@litbase/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

const keys = {
  domains: ['admin', 'domains'] as const,
  users: ['admin', 'users'] as const,
}

export function useAdminDomains() {
  return useQuery({ queryKey: keys.domains, queryFn: api.admin.listDomains })
}

export function useAdminUsers() {
  return useQuery({ queryKey: keys.users, queryFn: api.admin.listUsers })
}

/** Nach jeder Änderung: Domains, Nutzerstatus und die öffentliche Institutionsliste neu laden. */
function useInvalidate() {
  const queryClient = useQueryClient()
  return async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin'] })
    await queryClient.invalidateQueries({ queryKey: ['institutions'] })
  }
}

export function useDomainMutations() {
  const onSuccess = useInvalidate()
  return {
    create: useMutation({ mutationFn: (input: DomainInput) => api.admin.createDomain(input), onSuccess }),
    update: useMutation({
      mutationFn: ({ id, ...input }: UpdateDomain & { id: string }) => api.admin.updateDomain(id, input),
      onSuccess,
    }),
    remove: useMutation({ mutationFn: (id: string) => api.admin.deleteDomain(id), onSuccess }),
    uploadLogo: useMutation({
      mutationFn: ({ id, file }: { id: string; file: File }) => api.admin.uploadLogo(id, file),
      onSuccess,
    }),
    removeLogo: useMutation({ mutationFn: (id: string) => api.admin.deleteLogo(id), onSuccess }),
  }
}
