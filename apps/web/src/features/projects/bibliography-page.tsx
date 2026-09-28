import { de } from '@litbase/shared'
import { useParams } from 'react-router'
import { PageBody } from '../app-shell/page-body'
import { PageHeader } from '../app-shell/page-header'
import { BibliographyPanel } from './bibliography-panel'

export function BibliographyPage() {
  const { projectId = '' } = useParams()
  return (
    <>
      <PageHeader title={de.nav.bibliography} />
      <PageBody>
        <BibliographyPanel projectId={projectId} />
      </PageBody>
    </>
  )
}
