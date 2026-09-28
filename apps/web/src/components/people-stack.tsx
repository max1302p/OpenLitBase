import { de, type ProjectPerson } from '@litbase/shared'
import { Tooltip, TooltipContent, TooltipTrigger } from '@litbase/ui/components/tooltip'
import { UserAvatar } from '@litbase/ui/components/user-avatar'
import { cn } from '@litbase/ui/lib/utils'

interface PeopleStackProps {
  people: ProjectPerson[]
  /** Danach „+n“. */
  max?: number
  className?: string
}

/** Überlappende Avatare der Personen mit Zugriff; Name und Recht als Tooltip. */
export function PeopleStack({ people, max = 4, className }: PeopleStackProps) {
  const shown = people.slice(0, max)
  const rest = people.slice(max)
  return (
    <div className={cn('flex items-center -space-x-2', className)}>
      {shown.map((person) => (
        <Tooltip key={person.userId}>
          <TooltipTrigger asChild>
            <span className="rounded-full ring-2 ring-background">
              <UserAvatar userId={person.userId} name={person.name} className="size-7 rounded-full" />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {person.name} · {de.sharing.roles[person.role]}
          </TooltipContent>
        </Tooltip>
      ))}
      {rest.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-medium ring-2 ring-background">
              +{rest.length}
            </span>
          </TooltipTrigger>
          <TooltipContent>{rest.map((p) => p.name).join(', ')}</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
