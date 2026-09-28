import type { LucideIcon } from 'lucide-react'
import { ChevronRight, Loader2 } from 'lucide-react'

interface ChoiceCardProps {
  icon: LucideIcon
  title: string
  description: string
  pending?: boolean
  onClick: () => void
}

/** Grosse Auswahlkarte im Einrichtungs-Assistenten. */
export function ChoiceCard({ icon: Icon, title, description, pending, onClick }: ChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="flex items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/50 disabled:opacity-70"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        <Icon className="size-5" />
      </span>
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </span>
      {pending ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
    </button>
  )
}
