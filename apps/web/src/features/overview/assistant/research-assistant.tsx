import { checkQuestion, composeTriad, de, type ProjectResearch, type QuestionCheck } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@litbase/ui/components/dialog'
import { Label } from '@litbase/ui/components/label'
import { Textarea } from '@litbase/ui/components/textarea'
import { cn } from '@litbase/ui/lib/utils'
import { useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/lib/error-message'
import { useUpdateProject } from '../../projects/use-projects'

const steps = ['topic', 'knowledgeGoal', 'relevance', 'question'] as const

interface ResearchAssistantProps {
  projectId: string
  research: ProjectResearch
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ResearchAssistant({ projectId, research, open, onOpenChange }: ResearchAssistantProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open && <Assistant projectId={projectId} initial={research} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

/** Erster Hinweis zur Forschungsfrage, der noch nicht erfüllt ist. */
function questionHint(question: string) {
  if (!question.trim()) return undefined
  const checks = checkQuestion(question)
  const failed = (['questionMark', 'open', 'length'] as QuestionCheck[]).find((key) => !checks[key])
  return failed && de.research.steps.question.checks[failed]
}

/** Vier schlichte Schritte: eine Frage, ein Feld, ein Hinweis. Zum Schluss der zusammengesetzte Satz. */
function Assistant({ projectId, initial, onDone }: { projectId: string; initial: ProjectResearch; onDone: () => void }) {
  const [draft, setDraft] = useState<ProjectResearch>(initial)
  // Beim Bearbeiten beim ersten offenen Schritt beginnen.
  const [step, setStep] = useState(() => Math.max(0, steps.findIndex((key) => !initial[key]?.trim())))
  const update = useUpdateProject(projectId)
  const key = steps[step]!
  const text = de.research.steps[key]
  const value = draft[key] ?? ''
  const last = step === steps.length - 1
  const warning = key === 'question' ? questionHint(value) : undefined

  function save() {
    update.mutate(
      { research: draft },
      { onSuccess: () => (toast.success(de.research.saved), onDone()), onError: (e) => toast.error(errorMessage(e)) },
    )
  }

  return (
    <>
      <DialogHeader className="gap-3">
        <div className="flex items-center justify-between gap-4 pr-8">
          <DialogTitle>{de.research.title}</DialogTitle>
          <span className="text-xs text-muted-foreground tabular-nums">
            {step + 1}/{steps.length}
          </span>
        </div>
        <DialogDescription className="sr-only">{de.research.description}</DialogDescription>
        <div className="flex gap-1" aria-hidden>
          {steps.map((s, i) => (
            <span key={s} className={cn('h-1 flex-1 rounded-full', i <= step ? 'bg-primary' : 'bg-muted')} />
          ))}
        </div>
      </DialogHeader>

      <div className="grid gap-2">
        <Label htmlFor={`research-${key}`} className="text-base">
          {text.title}
        </Label>
        {key === 'question' ? (
          <p className="rounded-md bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
            {composeTriad(draft).map((segment) => segment.text).join('')}
          </p>
        ) : (
          <span className="text-sm text-muted-foreground">{de.research.steps[key].frame}</span>
        )}
        <Textarea
          key={key}
          id={`research-${key}`}
          autoFocus
          rows={3}
          value={value}
          onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
          placeholder={text.placeholder}
          className="resize-none"
        />
        <p className={cn('text-xs', warning ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground')}>
          {warning ?? text.hint}
        </p>
      </div>

      <DialogFooter>
        {step > 0 && (
          <Button variant="ghost" onClick={() => setStep(step - 1)} className="sm:mr-auto">
            {de.research.back}
          </Button>
        )}
        {last ? (
          <Button onClick={save} disabled={update.isPending}>
            {de.research.save}
          </Button>
        ) : (
          <Button onClick={() => setStep(step + 1)}>{de.research.next}</Button>
        )}
      </DialogFooter>
    </>
  )
}
