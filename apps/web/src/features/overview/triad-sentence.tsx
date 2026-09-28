import { composeTriad, de, type ProjectResearch, type TriadPart } from '@litbase/shared'
import { cn } from '@litbase/ui/lib/utils'

/** Eine Farbe pro Teil des Dreisatzes – in Satz, Legende und Assistent gleich. */
export const partStyles: Record<TriadPart, string> = {
  topic: 'bg-sky-100 text-sky-950 dark:bg-sky-400/20 dark:text-sky-100',
  knowledgeGoal: 'bg-amber-100 text-amber-950 dark:bg-amber-400/20 dark:text-amber-100',
  relevance: 'bg-emerald-100 text-emerald-950 dark:bg-emerald-400/20 dark:text-emerald-100',
}

export const partDots: Record<TriadPart, string> = {
  topic: 'bg-sky-400',
  knowledgeGoal: 'bg-amber-400',
  relevance: 'bg-emerald-400',
}

interface TriadSentenceProps {
  research: ProjectResearch
  /** Im Assistenten: der gerade bearbeitete Teil wird betont. */
  active?: TriadPart
  className?: string
}

/** „Ich untersuche [Thema], weil ich herausfinden möchte, [Erkenntnisinteresse], um [Relevanz].“ */
export function TriadSentence({ research, active, className }: TriadSentenceProps) {
  return (
    <p className={cn('leading-relaxed', className)}>
      {composeTriad(research).map((segment, i) =>
        segment.part ? (
          <mark
            key={i}
            className={cn(
              'rounded-md px-1.5 py-0.5 box-decoration-clone transition-opacity',
              segment.missing ? 'border border-dashed bg-transparent text-muted-foreground' : partStyles[segment.part],
              active && active !== segment.part && 'opacity-50',
              active === segment.part && 'ring-2 ring-ring/40',
            )}
          >
            {segment.text}
          </mark>
        ) : (
          <span key={i}>{segment.text}</span>
        ),
      )}
    </p>
  )
}

export function TriadLegend() {
  const parts: TriadPart[] = ['topic', 'knowledgeGoal', 'relevance']
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {parts.map((part) => (
        <span key={part} className="flex items-center gap-1.5">
          <span className={cn('size-2 rounded-full', partDots[part])} />
          {de.research.steps[part].label}
        </span>
      ))}
    </div>
  )
}
