import { de, type ProjectResearch } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@litbase/ui/components/card'
import { cn } from '@litbase/ui/lib/utils'
import { CompassIcon, PencilIcon, SparklesIcon } from 'lucide-react'
import { TriadLegend, TriadSentence } from './triad-sentence'

interface ResearchCardProps {
  research: ProjectResearch
  canEdit: boolean
  onOpenAssistant: () => void
  className?: string
}

/** Dreisatz als hervorgehobener Satz und die Forschungsfrage – oder der Einstieg in den Assistenten. */
export function ResearchCard({ research, canEdit, onOpenAssistant, className }: ResearchCardProps) {
  const started = Boolean(research.topic || research.knowledgeGoal || research.relevance || research.question)

  if (!started) {
    return (
      <Card className={cn('justify-center overflow-hidden', className)}>
        <CardContent className="flex flex-col items-start gap-4 py-2 sm:flex-row sm:items-center">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <CompassIcon className="size-7" />
          </div>
          <div className="grid flex-1 gap-1">
            <h2 className="text-lg font-semibold">{de.overview.researchEmptyTitle}</h2>
            <p className="text-sm text-muted-foreground">{de.overview.researchEmptyDescription}</p>
          </div>
          {canEdit && (
            <Button onClick={onOpenAssistant} className="shrink-0">
              <SparklesIcon /> {de.overview.startAssistant}
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{de.overview.researchTitle}</CardTitle>
        <CardDescription>{de.overview.researchDescription}</CardDescription>
        {canEdit && (
          <CardAction>
            <Button variant="outline" size="sm" onClick={onOpenAssistant}>
              <PencilIcon /> {de.overview.editAssistant}
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-3">
          <TriadSentence research={research} className="text-lg" />
          <TriadLegend />
        </div>
        <div className="grid gap-1.5 border-l-4 border-primary pl-4">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{de.overview.questionTitle}</span>
          {research.question ? (
            <p className="text-xl font-semibold tracking-tight text-balance">{research.question}</p>
          ) : (
            <p className="text-sm text-muted-foreground">{de.overview.questionMissing}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
