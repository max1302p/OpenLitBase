import { de } from '@litbase/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@litbase/ui/components/card'
import { useState } from 'react'
import { StyleSelect } from '../citation/style-select'
import { useSettings } from '../citation/use-styles'
import { useActiveProject } from '../projects/use-projects'
import { useFormattedItem } from './use-items'

/** Formatierter Verzeichniseintrag; Stil umschaltbar (Default: Stil des Projekts). */
export function ItemPreviewCard({ itemId, projectId }: { itemId: string; projectId: string }) {
  const settings = useSettings()
  const { project } = useActiveProject()
  const [styleId, setStyleId] = useState<string>()
  const activeStyle = styleId ?? project?.citationStyle ?? settings.data?.citationStyle
  const formatted = useFormattedItem(itemId, activeStyle, projectId)
  const entry = formatted.data?.entries[0]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{de.items.preview}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {activeStyle && <StyleSelect value={activeStyle} onChange={setStyleId} />}
        <div className="csl-bibliography rounded-md bg-muted/50 p-3 text-sm leading-relaxed">
          {entry ? (
            <div dangerouslySetInnerHTML={{ __html: entry.html }} />
          ) : (
            <span className="text-muted-foreground">{de.common.loading}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
