import type { CreateProject, UpdateProject } from '@litbase/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router'
import { api } from '@/lib/api'
import { getLastProjectId } from '@/lib/last-project'
import { queryKeys } from '@/lib/query-client'

export function useProjects() {
  return useQuery({ queryKey: queryKeys.projects, queryFn: api.listProjects })
}

/**
 * Aktives Projekt: aus der URL, sonst (z. B. auf /settings) das zuletzt geöffnete,
 * damit Sidebar und Switcher immer einen Kontext haben.
 */
export function useActiveProject() {
  const { projectId } = useParams()
  const projects = useProjects()
  const id = projectId ?? getLastProjectId()
  const project = projects.data?.find((p) => p.id === id) ?? (projectId ? undefined : projects.data?.[0])
  return { project, projects: projects.data ?? [], isPending: projects.isPending }
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProject) => api.createProject(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
  })
}

export function useUpdateProject(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateProject) => api.updateProject(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects })
      await queryClient.invalidateQueries({ queryKey: queryKeys.bibliography(id) })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteProject(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects })
      await queryClient.invalidateQueries({ queryKey: queryKeys.items })
    },
  })
}

export function useBibliography(projectId: string) {
  return useQuery({ queryKey: queryKeys.bibliography(projectId), queryFn: () => api.getBibliography(projectId) })
}
