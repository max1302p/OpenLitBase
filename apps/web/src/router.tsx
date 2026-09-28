import { createBrowserRouter, Navigate } from 'react-router'
import { AdminPage } from './features/admin/admin-page'
import { AppLayout } from './features/app-shell/app-layout'
import { AuthGate } from './features/auth/auth-gate'
import { BookmarkletAddPage } from './features/bookmarklet/bookmarklet-add-page'
import { ForgotPasswordPage } from './features/auth/forgot-password-page'
import { LoginPage } from './features/auth/login-page'
import { ResetPasswordPage } from './features/auth/reset-password-page'
import { ItemDetailPage } from './features/items/item-detail-page'
import { BibliographyPage } from './features/projects/bibliography-page'
import { ProjectOverviewPage } from './features/overview/overview-page'
import { ProjectHome } from './features/projects/project-home'
import { ProjectItemsPage } from './features/projects/project-items-page'
import { ProjectLayout } from './features/projects/project-layout'
import { ProjectSettingsPage } from './features/projects/project-settings-page'
import { ProtocolPage } from './features/protocol/protocol-page'
import { SettingsPage } from './features/settings/settings-page'
import { TermMatrixPage } from './features/term-matrix/term-matrix-page'

/** Alles Inhaltliche liegt unter /projects/:projectId; Konto und Administration sind global. */
export const router = createBrowserRouter([
  { path: '/login', Component: LoginPage },
  { path: '/forgot-password', Component: ForgotPasswordPage },
  { path: '/reset-password', Component: ResetPasswordPage },
  {
    Component: AuthGate,
    children: [
      { path: 'add', Component: BookmarkletAddPage },
      {
        Component: AppLayout,
        children: [
          { index: true, Component: ProjectHome },
          {
            path: 'projects/:projectId',
            Component: ProjectLayout,
            children: [
              { index: true, Component: ProjectOverviewPage },
              { path: 'items', Component: ProjectItemsPage },
              { path: 'items/:itemId', Component: ItemDetailPage },
              { path: 'bibliography', Component: BibliographyPage },
              { path: 'protocol', Component: ProtocolPage },
              { path: 'matrix', Component: TermMatrixPage },
              { path: 'settings', Component: ProjectSettingsPage },
            ],
          },
          { path: 'settings', Component: SettingsPage },
          { path: 'admin', Component: AdminPage },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
])
