import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router'

export interface StatTile {
  to: string
  icon: LucideIcon
  label: string
  value: string
  hint: string
}

/** Kennzahlen des Projekts, jede führt in ihren Bereich. */
export function StatTiles({ tiles }: { tiles: StatTile[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {tiles.map(({ to, icon: Icon, label, value, hint }) => (
        <Link key={to} to={to} className="group grid gap-3 rounded-xl border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-accent/40">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon className="size-4" />
            {label}
          </div>
          <div className="grid gap-0.5">
            <span className="truncate text-2xl font-semibold tracking-tight">{value}</span>
            <span className="truncate text-xs text-muted-foreground">{hint}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
