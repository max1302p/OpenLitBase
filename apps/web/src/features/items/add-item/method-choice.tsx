import { de } from '@litbase/shared'
import { ChevronRightIcon, FileUpIcon, PencilLineIcon, ScanSearchIcon, type LucideIcon } from 'lucide-react'

export type AddMethod = 'identifier' | 'manual' | 'import'

const METHODS: { id: AddMethod; icon: LucideIcon }[] = [
  { id: 'identifier', icon: ScanSearchIcon },
  { id: 'manual', icon: PencilLineIcon },
  { id: 'import', icon: FileUpIcon },
]

/** Erster Schritt: grosse, klar beschriebene Auswahl. */
export function MethodChoice({ onChoose }: { onChoose: (method: AddMethod) => void }) {
  return (
    <div className="grid gap-3">
      {METHODS.map(({ id, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChoose(id)}
          className="group flex items-center gap-4 rounded-xl border p-4 text-left transition-colors hover:border-primary/40 hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Icon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium">{de.addItem.methods[id].title}</p>
            <p className="text-sm text-muted-foreground">{de.addItem.methods[id].description}</p>
          </div>
          <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </button>
      ))}
    </div>
  )
}
