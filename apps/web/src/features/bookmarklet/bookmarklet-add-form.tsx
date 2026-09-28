import { canEditProject, de, detectIdentifier, type AddByIdentifierResult, type BookmarkletWork, type Project } from '@litbase/shared'
import { Badge } from '@litbase/ui/components/badge'
import { Button } from '@litbase/ui/components/button'
import { Input } from '@litbase/ui/components/input'
import { Label } from '@litbase/ui/components/label'
import { ProjectSelect } from '@litbase/ui/components/project-select'
import { Loader2Icon, PlusIcon, TriangleAlertIcon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { errorMessage } from '@/lib/error-message'
import { getLastProjectId, setLastProjectId } from '@/lib/last-project'
import { AddedItemCard } from '../items/add-item/added-item-card'
import { useAddByIdentifier } from '../items/use-items'

interface BookmarkletAddFormProps {
  work: BookmarkletWork
  projects: Project[]
}

/** Erkannte Angabe prüfen, Projekt wählen, übernehmen – danach Titel öffnen oder Fenster schliessen. */
export function BookmarkletAddForm({ work, projects }: BookmarkletAddFormProps) {
  const writable = projects.filter(canEditProject)
  const last = getLastProjectId()
  const [projectId, setProjectId] = useState(writable.find((p) => p.id === last)?.id ?? writable[0]?.id)
  const [value, setValue] = useState(work.input)
  const [result, setResult] = useState<AddByIdentifierResult>()
  const addItem = useAddByIdentifier()
  const detected = detectIdentifier(value)
  // Vom Lesezeichen geöffnet → das Fenster darf sich selbst schliessen.
  const canClose = window.opener !== null

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!detected || !projectId) return
    addItem.mutate(
      { input: value, projectId },
      { onSuccess: (added) => (setResult(added), setLastProjectId(projectId)) },
    )
  }

  if (writable.length === 0) {
    return (
      <div className="grid gap-4 text-sm text-muted-foreground">
        <p>{de.bookmarklet.noProjects}</p>
        <Button asChild>
          <Link to="/">{de.bookmarklet.openApp}</Link>
        </Button>
      </div>
    )
  }

  if (result) {
    return (
      <div className="grid gap-4">
        <AddedItemCard item={result.item} created={result.created} />
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" asChild>
            <Link to={`/projects/${projectId}/items/${result.item.id}`}>{de.addItem.openItem}</Link>
          </Button>
          {canClose && <Button onClick={() => window.close()}>{de.bookmarklet.close}</Button>}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {work.title && <p className="font-medium leading-snug">{work.title}</p>}
      <div className="grid gap-1.5">
        <Label htmlFor="bookmarklet-input">{de.bookmarklet.inputLabel}</Label>
        <Input
          id="bookmarklet-input"
          value={value}
          onChange={(e) => (setValue(e.target.value), addItem.reset())}
          disabled={addItem.isPending}
        />
        <p className="text-xs text-muted-foreground">
          {detected ? (
            <Badge variant="secondary">{de.addItem.detectedAs(de.items.detected[detected.type])}</Badge>
          ) : (
            de.addItem.notDetected
          )}
        </p>
      </div>
      <ProjectSelect
        projects={writable}
        value={projectId}
        onChange={setProjectId}
        label={de.bookmarklet.projectLabel}
        placeholder={de.bookmarklet.projectPlaceholder}
      />
      {addItem.isError && (
        <p className="flex items-center gap-2 text-sm font-medium text-destructive">
          <TriangleAlertIcon className="size-4 shrink-0" /> {errorMessage(addItem.error)}
        </p>
      )}
      <Button type="submit" disabled={!detected || !projectId || addItem.isPending}>
        {addItem.isPending ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
        {addItem.isPending ? de.addItem.searching : de.bookmarklet.add}
      </Button>
    </form>
  )
}
