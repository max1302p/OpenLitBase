import { de, type ProjectPerson } from '@litbase/shared'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@litbase/ui/components/card'
import { UserAvatar } from '@litbase/ui/components/user-avatar'
import type { ReactNode } from 'react'

/** Personen mit Zugriff auf ein geteiltes Projekt. */
export function TeamCard({ people, action, className }: { people: ProjectPerson[]; action?: ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{de.overview.peopleTitle}</CardTitle>
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent>
        <ul className="grid gap-3">
          {people.map((person) => (
            <li key={person.userId} className="flex items-center gap-3">
              <UserAvatar userId={person.userId} name={person.name} className="size-8 rounded-full" />
              <span className="flex-1 truncate text-sm font-medium">{person.name}</span>
              <span className="text-xs text-muted-foreground">{de.sharing.roles[person.role]}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
