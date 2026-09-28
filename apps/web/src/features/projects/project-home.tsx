import { de } from '@litbase/shared'
import { Navigate } from 'react-router'
import { getLastProjectId } from '@/lib/last-project'
import { FullPageMessage } from '../app-shell/full-page-message'
import { OnboardingPage } from './onboarding-page'
import { useProjects } from './use-projects'

/** Startseite: zuletzt geöffnetes (oder erstes) Projekt – ohne Projekte der Einstieg. */
export function ProjectHome() {
  const projects = useProjects()
  if (projects.isPending) return <FullPageMessage>{de.common.loading}</FullPageMessage>
  const list = projects.data ?? []
  if (list.length === 0) return <OnboardingPage />
  const last = getLastProjectId()
  const target = list.find((p) => p.id === last) ?? list[0]!
  return <Navigate to={`/projects/${target.id}`} replace />
}
