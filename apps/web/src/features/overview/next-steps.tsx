import { de } from '@litbase/shared'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@litbase/ui/components/card'
import { cn } from '@litbase/ui/lib/utils'
import { ChevronRightIcon, CircleCheckIcon, CircleIcon } from 'lucide-react'
import { Link } from 'react-router'

export interface NextStep {
  label: string
  done: boolean
  /** Link in den Bereich oder eine Aktion (z. B. Assistent öffnen). */
  to?: string
  onClick?: () => void
}

export function NextSteps({ steps, className }: { steps: NextStep[]; className?: string }) {
  const done = steps.filter((s) => s.done).length
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{de.overview.nextTitle}</CardTitle>
        <CardDescription>{de.overview.nextProgress(done, steps.length)}</CardDescription>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(done / steps.length) * 100}%` }} />
        </div>
      </CardHeader>
      <CardContent>
        <ul className="-mx-2 grid gap-0.5">
          {steps.map((step) => {
            const content = (
              <>
                {step.done ? <CircleCheckIcon className="size-4 shrink-0 text-emerald-600" /> : <CircleIcon className="size-4 shrink-0 text-muted-foreground" />}
                <span className={cn('flex-1', step.done && 'text-muted-foreground line-through decoration-muted-foreground/40')}>{step.label}</span>
                {!step.done && <ChevronRightIcon className="size-4 text-muted-foreground" />}
              </>
            )
            const cls = 'flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm hover:bg-muted'
            return (
              <li key={step.label}>
                {step.to ? (
                  <Link to={step.to} className={cls}>
                    {content}
                  </Link>
                ) : (
                  <button type="button" onClick={step.onClick} disabled={!step.onClick} className={cn(cls, !step.onClick && 'hover:bg-transparent')}>
                    {content}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
