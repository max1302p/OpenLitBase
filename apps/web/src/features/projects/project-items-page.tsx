import { de } from '@litbase/shared'
import { useParams } from 'react-router'
import { PageBody } from '../app-shell/page-body'
import { PageHeader } from '../app-shell/page-header'
import { ItemsView } from '../items/items-view'

export function ProjectItemsPage() {
  const { projectId = '' } = useParams()
  return (
    <>
      <PageHeader title={de.nav.items} />
      <PageBody>
        <ItemsView projectId={projectId} />
      </PageBody>
    </>
  )
}
