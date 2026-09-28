import { de, formatAuthors, getYear, itemTitle, typeLabel, type Item } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@litbase/ui/components/card'
import { Link } from 'react-router'

export function RecentItems({ projectId, items, className }: { projectId: string; items: Item[]; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{de.overview.recentTitle}</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/projects/${projectId}/items`}>{de.overview.allItems}</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{de.overview.recentEmpty}</p>
        ) : (
          <ul className="-mx-2 grid">
            {items.slice(0, 5).map((item) => (
              <li key={item.id}>
                <Link to={`/projects/${projectId}/items/${item.id}`} className="grid gap-0.5 rounded-md px-2 py-2 hover:bg-muted">
                  <span className="truncate text-sm font-medium">{itemTitle(item.csl)}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {[formatAuthors(item.csl, 2), getYear(item.csl), typeLabel(item.csl.type)].filter(Boolean).join(' · ')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
