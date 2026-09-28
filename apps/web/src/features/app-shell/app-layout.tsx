import { SidebarInset, SidebarProvider } from '@litbase/ui/components/sidebar'
import { Outlet } from 'react-router'
import { AppSidebar } from './app-sidebar'

export function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      {/* min-w-0: sonst wächst der Inhalt über den Bildschirm und schiebt Konto/Farbschema hinaus. */}
      <SidebarInset className="min-w-0">
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
