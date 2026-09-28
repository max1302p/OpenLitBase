import { de } from '@litbase/shared'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@litbase/ui/components/card'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

/** Installierte Version und Hinweis auf Updates – nur für Admins bzw. im Modus "single". */
export function VersionCard() {
  const status = useQuery({ queryKey: ['update-status'], queryFn: api.getUpdateStatus, retry: false, staleTime: 60 * 60 * 1000 })
  if (!status.data) return null
  const s = status.data
  return (
    <Card>
      <CardHeader>
        <CardTitle>{de.settings.versionTitle}</CardTitle>
        <CardDescription>{de.settings.versionCurrent(s.current)}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm">
        {!s.enabled ? (
          <p className="text-muted-foreground">{de.settings.versionOff}</p>
        ) : s.updateAvailable && s.latest ? (
          <p className="font-medium">
            {de.settings.versionUpdate(s.latest)}{' '}
            {s.url && (
              <a href={s.url} target="_blank" rel="noopener" className="text-primary underline underline-offset-4">
                {de.settings.versionUpdateLink}
              </a>
            )}
          </p>
        ) : (
          <p className="text-muted-foreground">{s.checkedAt ? de.settings.versionLatest : de.settings.versionPending}</p>
        )}
        {s.enabled && <p className="text-muted-foreground text-xs">{de.settings.versionPrivacy}</p>}
      </CardContent>
    </Card>
  )
}
