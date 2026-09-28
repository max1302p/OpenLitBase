import { de } from '@litbase/shared'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@litbase/ui/components/tabs'
import { Navigate, useSearchParams } from 'react-router'
import { PageBody } from '../app-shell/page-body'
import { PageHeader } from '../app-shell/page-header'
import { useMe } from '../auth/use-session'
import { DomainsPanel } from './domains-panel'
import { UsersPanel } from './users-panel'

export function AdminPage() {
  const me = useMe()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'users' ? 'users' : 'domains'
  if (me.data && !me.data.isAdmin) return <Navigate to="/" replace />

  return (
    <>
      <PageHeader title={de.admin.title} />
      <PageBody>
      <Tabs
        value={tab}
        onValueChange={(value) => setSearchParams(value === 'domains' ? {} : { tab: value }, { replace: true })}
      >
        <TabsList>
          <TabsTrigger value="domains">{de.admin.tabDomains}</TabsTrigger>
          <TabsTrigger value="users">{de.admin.tabUsers}</TabsTrigger>
        </TabsList>
        <TabsContent value="domains" className="pt-2">
          <DomainsPanel />
        </TabsContent>
        <TabsContent value="users" className="pt-2">
          <UsersPanel />
        </TabsContent>
      </Tabs>
      </PageBody>
    </>
  )
}
