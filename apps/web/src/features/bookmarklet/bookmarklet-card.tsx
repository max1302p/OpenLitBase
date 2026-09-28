import { bookmarkletUrl, de } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@litbase/ui/components/card'
import { BookmarkPlusIcon, CopyIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

/** Lesezeichen „Zu OpenLitBase“ zum Ziehen (Desktop) oder Kopieren (iPhone, iPad). */
export function BookmarkletCard() {
  const url = bookmarkletUrl(window.location.origin)
  const link = useRef<HTMLAnchorElement>(null)

  // React blockiert javascript:-Adressen im href, deshalb direkt am Element setzen.
  useEffect(() => link.current?.setAttribute('href', url), [url])

  async function copy() {
    await navigator.clipboard.writeText(url)
    toast.success(de.bookmarklet.copied)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{de.bookmarklet.title}</CardTitle>
        <CardDescription>{de.bookmarklet.description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm">
        <div className="grid gap-2">
          <p className="text-muted-foreground">{de.bookmarklet.dragHint}</p>
          <div>
            <Button variant="secondary" asChild>
              <a ref={link} onClick={(e) => e.preventDefault()} className="cursor-grab">
                <BookmarkPlusIcon /> {de.bookmarklet.button}
              </a>
            </Button>
          </div>
        </div>
        <div className="grid gap-2">
          <p className="text-muted-foreground">{de.bookmarklet.iosHint}</p>
          <div>
            <Button variant="outline" size="sm" onClick={() => void copy()}>
              <CopyIcon /> {de.bookmarklet.copy}
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">{de.bookmarklet.selectionHint}</p>
      </CardContent>
    </Card>
  )
}
