import type { InviteMember, MemberRole } from '@litbase/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-client'

export function useMembers(projectId: string, enabled = true) {
  return useQuery({ queryKey: queryKeys.members(projectId), queryFn: () => api.listMembers(projectId), enabled })
}

/** Nach Änderungen auch die Projektliste neu laden (Avatar-Fächer, Geteilt-Symbol). */
function useInvalidate(projectId: string) {
  const queryClient = useQueryClient()
  return async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.members(projectId) })
    await queryClient.invalidateQueries({ queryKey: queryKeys.projects })
  }
}

export function useInviteMember(projectId: string) {
  const onSuccess = useInvalidate(projectId)
  return useMutation({ mutationFn: (input: InviteMember) => api.inviteMember(projectId, input), onSuccess })
}

export function useUpdateMember(projectId: string) {
  const onSuccess = useInvalidate(projectId)
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: MemberRole }) => api.updateMember(projectId, memberId, { role }),
    onSuccess,
  })
}

export function useRemoveMember(projectId: string) {
  const onSuccess = useInvalidate(projectId)
  return useMutation({ mutationFn: (memberId: string) => api.removeMember(projectId, memberId), onSuccess })
}
