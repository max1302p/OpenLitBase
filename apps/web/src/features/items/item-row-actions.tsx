import { canEditProject, de, type Item } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@litbase/ui/components/dropdown-menu'
import { CopyPlusIcon, EllipsisIcon, SquareArrowOutUpRightIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { InitialsAvatar } from '@litbase/ui/components/initials-avatar'
import { errorMessage } from '@/lib/error-message'
import { useProjects } from '../projects/use-projects'
import { useProjectPermissions } from '../projects/use-permissions'
import { RemoveItemDialog } from './remove-item-dialog'
import { useProjectMembership } from './use-items'

interface ItemRowActionsProps {
  item: Item
  projectId: string
}

export function ItemRowActions({ item, projectId }: ItemRowActionsProps) {
  const navigate = useNavigate()
  const projects = useProjects()
  const { add } = useProjectMembership()
  const [confirmRemove, setConfirmRemove] = useState(false)
  const { canEdit } = useProjectPermissions()
  const otherProjects = projects.data?.filter((p) => !item.projectIds.includes(p.id) && canEditProject(p)) ?? []

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={de.items.actions}>
            <EllipsisIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => void navigate(`/projects/${projectId}/items/${item.id}`)}>
            <SquareArrowOutUpRightIcon /> {de.items.open}
          </DropdownMenuItem>
          {otherProjects.length > 0 && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <CopyPlusIcon /> {de.items.addToProject}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {otherProjects.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    onClick={() =>
                      add.mutate(
                        { projectId: project.id, itemIds: [item.id] },
                        {
                          onSuccess: () => toast.success(de.items.addedToProject),
                          onError: (error) => toast.error(errorMessage(error)),
                        },
                      )
                    }
                  >
                    <InitialsAvatar name={project.name} className="size-5" />
                    {project.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
          {canEdit && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setConfirmRemove(true)}>
                <Trash2Icon /> {de.items.remove}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <RemoveItemDialog projectId={projectId} itemId={item.id} open={confirmRemove} onOpenChange={setConfirmRemove} />
    </div>
  )
}
