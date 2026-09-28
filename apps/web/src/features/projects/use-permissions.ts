import { canEditProject } from '@litbase/shared'
import { useActiveProject } from './use-projects'

/** Eigenes Recht im aktiven Projekt: Bearbeiten (Besitzer:in, „Bearbeiten“) oder nur Lesen. */
export function useProjectPermissions() {
  const { project } = useActiveProject()
  return {
    canEdit: project ? canEditProject(project) : false,
    isOwner: project?.role === 'owner',
  }
}
