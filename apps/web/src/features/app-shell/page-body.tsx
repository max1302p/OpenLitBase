import { cn } from '@litbase/ui/lib/utils'
import type { ReactNode } from 'react'

/** Einheitlicher, luftiger Inhaltsbereich unter der Topbar (volle Breite). */
export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-1 flex-col gap-6 p-6 lg:p-8', className)}>{children}</div>
}
