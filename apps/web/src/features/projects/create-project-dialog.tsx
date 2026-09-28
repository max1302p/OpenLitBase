import { createProjectSchema, de } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@litbase/ui/components/dialog'
import { Input } from '@litbase/ui/components/input'
import { Label } from '@litbase/ui/components/label'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/lib/error-message'
import { DEFAULT_STYLE_VALUE, StyleSelect } from '../citation/style-select'
import { useSettings, useStyleTitle } from '../citation/use-styles'
import { useCreateProject } from './use-projects'

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const [name, setName] = useState('')
  const [style, setStyle] = useState(DEFAULT_STYLE_VALUE)
  const settings = useSettings()
  const defaultTitle = useStyleTitle(settings.data?.citationStyle)
  const createProject = useCreateProject()
  const navigate = useNavigate()
  const parsed = createProjectSchema.safeParse({
    name,
    citationStyle: style === DEFAULT_STYLE_VALUE ? null : style,
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!parsed.success) return
    createProject.mutate(parsed.data, {
      onSuccess: (project) => {
        toast.success(de.projects.created)
        setName('')
        onOpenChange(false)
        void navigate(`/projects/${project.id}`)
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{de.projects.createTitle}</DialogTitle>
            <DialogDescription>{de.projects.createDescription}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="new-project-name">{de.projects.nameLabel}</Label>
            <Input
              id="new-project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={de.projects.namePlaceholder}
              autoFocus
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="new-project-style">{de.projects.citationStyle}</Label>
            <StyleSelect
              id="new-project-style"
              value={style}
              onChange={setStyle}
              defaultOptionLabel={`${de.projects.useAccountDefault} (${defaultTitle})`}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {de.common.cancel}
            </Button>
            <Button type="submit" disabled={!parsed.success || createProject.isPending}>
              {de.common.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
