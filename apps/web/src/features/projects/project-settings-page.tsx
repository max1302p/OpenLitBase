import { de, type Project } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@litbase/ui/components/card'
import { Input } from '@litbase/ui/components/input'
import { Label } from '@litbase/ui/components/label'
import { Trash2Icon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/lib/error-message'
import { PageBody } from '../app-shell/page-body'
import { PageHeader } from '../app-shell/page-header'
import { DEFAULT_STYLE_VALUE, StyleSelect } from '../citation/style-select'
import { useSettings, useStyleTitle } from '../citation/use-styles'
import { ShareButton } from '../sharing/share-button'
import { DeleteProjectDialog } from './delete-project-dialog'
import { useActiveProject, useUpdateProject } from './use-projects'

export function ProjectSettingsPage() {
  const { project } = useActiveProject()
  if (!project) return null
  // Name, Zitierstil und Löschen: nur die Person, der das Projekt gehört.
  if (project.role !== 'owner') return <Navigate to={`/projects/${project.id}`} replace />
  return <ProjectSettingsForm key={project.id} project={project} />
}

function ProjectSettingsForm({ project }: { project: Project }) {
  const [name, setName] = useState(project.name)
  const [style, setStyle] = useState(project.citationStyle ?? DEFAULT_STYLE_VALUE)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const settings = useSettings()
  const defaultTitle = useStyleTitle(settings.data?.citationStyle)
  const updateProject = useUpdateProject(project.id)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    updateProject.mutate(
      { name: name.trim(), citationStyle: style === DEFAULT_STYLE_VALUE ? null : style },
      { onSuccess: () => toast.success(de.projects.saved), onError: (e) => toast.error(errorMessage(e)) },
    )
  }

  return (
    <>
      <PageHeader title={de.projects.settingsTitle} actions={<ShareButton />} />
      <PageBody>
        <Card>
          <CardHeader>
            <CardTitle>{de.projects.generalTitle}</CardTitle>
            <CardDescription>{de.projects.styleDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="project-name">{de.projects.nameLabel}</Label>
                <Input id="project-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="project-style">{de.projects.citationStyle}</Label>
                <StyleSelect
                  id="project-style"
                  value={style}
                  onChange={setStyle}
                  defaultOptionLabel={`${de.projects.useAccountDefault} (${defaultTitle})`}
                />
              </div>
              <div>
                <Button type="submit" disabled={!name.trim() || updateProject.isPending}>
                  {de.common.save}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle>{de.projects.dangerTitle}</CardTitle>
            <CardDescription>{de.projects.deleteConfirm}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2Icon /> {de.projects.delete}
            </Button>
          </CardContent>
        </Card>
      </PageBody>
      <DeleteProjectDialog projectId={project.id} open={confirmDelete} onOpenChange={setConfirmDelete} />
    </>
  )
}
