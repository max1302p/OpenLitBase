import { de, workFromBookmarklet } from '@litbase/shared'
import { BrandLogo } from '@litbase/ui/components/brand-logo'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@litbase/ui/components/card'
import { useMemo } from 'react'
import { useLocation } from 'react-router'
import { FullPageMessage } from '../app-shell/full-page-message'
import { useProjects } from '../projects/use-projects'
import { BookmarkletAddForm } from './bookmarklet-add-form'

function hostOf(url: string) {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

/** Ziel des Lesezeichens „Zu OpenLitBase“: kleines Fenster ohne Sidebar (Angaben im `#`-Teil der Adresse). */
export function BookmarkletAddPage() {
  const { hash } = useLocation()
  const work = useMemo(() => workFromBookmarklet(hash), [hash])
  const projects = useProjects()

  if (projects.isPending) return <FullPageMessage>{de.common.loading}</FullPageMessage>

  return (
    <div className="flex min-h-svh flex-col items-center gap-5 bg-sidebar p-4 sm:justify-center sm:p-6">
      <BrandLogo className="h-7" />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{de.bookmarklet.pageTitle}</CardTitle>
          <CardDescription className="truncate">
            {work ? de.bookmarklet.fromPage(hostOf(work.pageUrl)) : de.bookmarklet.noPage}
          </CardDescription>
        </CardHeader>
        {work && (
          <CardContent>
            <BookmarkletAddForm work={work} projects={projects.data ?? []} />
          </CardContent>
        )}
      </Card>
    </div>
  )
}
