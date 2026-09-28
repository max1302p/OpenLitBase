import { de, isSharedProject } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { Share2Icon } from 'lucide-react'
import { useState } from 'react'
import { useConfig } from '../auth/use-session'
import { useActiveProject } from '../projects/use-projects'
import { ShareDialog } from './share-dialog'

/** „Teilen“ in der Kopfzeile; nur mit Login (Modus `multi`) – ohne Login gibt es nur ein Konto. */
export function ShareButton() {
  const { project } = useActiveProject()
  const isMulti = useConfig().data?.authMode === 'multi'
  const [open, setOpen] = useState(false)
  if (!project || !isMulti) return null
  // Mitglieder ohne Besitzrecht sehen den Knopf nur bei geteilten Projekten (Liste, Verlassen).
  if (project.role !== 'owner' && !isSharedProject(project)) return null
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Share2Icon /> {de.sharing.share}
      </Button>
      <ShareDialog projectId={project.id} isOwner={project.role === 'owner'} open={open} onOpenChange={setOpen} />
    </>
  )
}
