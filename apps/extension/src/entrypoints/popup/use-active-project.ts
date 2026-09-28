import type { ApiClient } from '@litbase/shared'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { projectItem } from '../../lib/settings'
import { useStorageItem } from './use-storage-item'

/** Aktives Projekt aus dem Speicher; fehlt es (oder wurde gelöscht), gilt das erste. */
export function useActiveProject(api: ApiClient, serverUrl: string) {
  const projects = useQuery({ queryKey: ['projects', serverUrl], queryFn: api.listProjects })
  const stored = useStorageItem(projectItem)
  const list = projects.data ?? []
  const projectId = list.some((p) => p.id === stored) ? stored! : list[0]?.id

  // Den Hintergrund (Picker, Protokoll) auf dasselbe Projekt festlegen.
  useEffect(() => {
    if (projectId && projectId !== stored) void projectItem.setValue(projectId)
  }, [projectId, stored])

  return { projects, projectId, select: (id: string) => void projectItem.setValue(id) }
}
