import { de } from '@litbase/shared'
import { useEffect } from 'react'
import { Navigate, Outlet, useParams } from 'react-router'
import { setLastProjectId } from '@/lib/last-project'
import { FullPageMessage } from '../app-shell/full-page-message'
import { useProjects } from './use-projects'

/** Rahmen für alles unter /projects/:projectId – merkt sich das Projekt als zuletzt geöffnet. */
export function ProjectLayout() {
  const { projectId } = useParams()
  const projects = useProjects()
  const exists = projects.data?.some((p) => p.id === projectId)

  useEffect(() => {
    if (exists) setLastProjectId(projectId)
  }, [exists, projectId])

  if (projects.isPending) return <FullPageMessage>{de.common.loading}</FullPageMessage>
  if (!exists) {
    setLastProjectId(undefined)
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
