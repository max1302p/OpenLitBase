import { de } from '@litbase/shared'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@litbase/ui/components/alert-dialog'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/lib/error-message'
import { setLastProjectId } from '@/lib/last-project'
import { useDeleteProject } from './use-projects'

interface DeleteProjectDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteProjectDialog({ projectId, open, onOpenChange }: DeleteProjectDialogProps) {
  const deleteProject = useDeleteProject()
  const navigate = useNavigate()

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{de.projects.delete}?</AlertDialogTitle>
          <AlertDialogDescription>{de.projects.deleteConfirm}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{de.common.cancel}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() =>
              deleteProject.mutate(projectId, {
                onSuccess: () => {
                  toast.success(de.projects.deleted)
                  setLastProjectId(undefined)
                  void navigate('/', { replace: true })
                },
                onError: (error) => toast.error(errorMessage(error)),
              })
            }
          >
            {de.projects.delete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
