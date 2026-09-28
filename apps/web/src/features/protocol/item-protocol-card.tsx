import { de } from '@litbase/shared'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@litbase/ui/components/card'
import { useProjectPermissions } from '../projects/use-permissions'
import { ProtocolFields } from './protocol-fields'
import { useProtocol, useSaveItemProtocol } from './use-protocol'

/** In der Titel-Detailansicht: die drei Felder des Rechercheprotokolls für das aktuelle Projekt. */
export function ItemProtocolCard({ projectId, itemId }: { projectId: string; itemId: string }) {
  const { canEdit } = useProjectPermissions()
  const entry = useProtocol(projectId).data?.entries.find((e) => e.itemId === itemId)
  const save = useSaveItemProtocol(projectId)
  if (!entry) return null
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {de.protocol.cardTitle} <span className="font-mono text-sm font-normal text-muted-foreground">[{entry.number}]</span>
        </CardTitle>
        <CardDescription>{de.protocol.cardDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <ProtocolFields
          idPrefix={`item-protocol-${itemId}`}
          protocol={entry.protocol}
          readOnly={!canEdit}
          onSave={(protocol) => save.mutate({ itemId, protocol })}
          className="md:grid-cols-1"
        />
      </CardContent>
    </Card>
  )
}
