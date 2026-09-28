import { ApiError, de } from '@litbase/shared'
import { Navigate, Outlet, useLocation } from 'react-router'
import { FullPageMessage } from '../app-shell/full-page-message'
import { BlockedPage } from './blocked-page'
import { useMe } from './use-session'

/** Lässt nur angemeldete User durch. Im Modus "single" liefert die API immer den lokalen User. */
export function AuthGate() {
  const me = useMe()
  const location = useLocation()
  const target = location.pathname + location.search + location.hash

  if (me.isPending) return <FullPageMessage>{de.common.loading}</FullPageMessage>
  if (me.error instanceof ApiError && me.error.status === 401) return <Navigate to={target === '/' ? '/login' : `/login?next=${encodeURIComponent(target)}`} replace />
  if (me.error instanceof ApiError && me.error.status === 403) return <BlockedPage message={me.error.message} />
  if (me.isError) return <FullPageMessage>{de.common.error}</FullPageMessage>
  return <Outlet />
}
