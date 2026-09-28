import { Badge } from '@litbase/ui/components/badge'
import { cn } from '@litbase/ui/lib/utils'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: ReactNode
  /** Knopf o. Ä., der aus dem leeren Zustand herausführt. */
  action?: ReactNode
  /** Kleiner Hinweis über dem Titel, z. B. „In Vorbereitung“. */
  badge?: string
  /** `page`: füllt die Seite (gestrichelter Rahmen); `inline`: kompakt in Karten/Tabellen. */
  size?: 'page' | 'inline'
  className?: string
}

/** Einheitlicher Leerzustand: Icon, Titel, Erklärung und – wo sinnvoll – der nächste Schritt. */
export function EmptyState({ icon: Icon, title, description, action, badge, size = 'page', className }: EmptyStateProps) {
  const page = size === 'page'
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        page ? 'flex-1 gap-4 rounded-xl border border-dashed px-6 py-16' : 'gap-3 px-4 py-8',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center bg-accent text-accent-foreground',
          page ? 'size-14 rounded-2xl' : 'size-10 rounded-xl',
        )}
      >
        <Icon className={page ? 'size-7' : 'size-5'} />
      </div>
      {badge && <Badge variant="outline">{badge}</Badge>}
      <h2 className={cn('font-semibold', page ? 'text-lg' : 'text-sm')}>{title}</h2>
      {description && (
        <p className={cn('max-w-md text-muted-foreground', page ? 'text-sm' : 'text-xs')}>{description}</p>
      )}
      {action}
    </div>
  )
}
