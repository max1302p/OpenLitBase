import { de } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { FolderPlusIcon } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '@litbase/ui/components/empty-state'
import { PageBody } from '../app-shell/page-body'
import { PageHeader } from '../app-shell/page-header'
import { CreateProjectDialog } from './create-project-dialog'

export function OnboardingPage() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <PageHeader title={de.appName} />
      <PageBody>
        <EmptyState
          icon={FolderPlusIcon}
          title={de.onboarding.title}
          description={de.onboarding.description}
          action={
            <Button onClick={() => setOpen(true)}>
              <FolderPlusIcon /> {de.onboarding.create}
            </Button>
          }
        />
      </PageBody>
      <CreateProjectDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
