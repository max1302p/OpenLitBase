import { de, type Item } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@litbase/ui/components/card'
import { Label } from '@litbase/ui/components/label'
import { Textarea } from '@litbase/ui/components/textarea'
import { useState } from 'react'
import { toast } from 'sonner'
import { ChipInput } from '@/components/chip-input'
import { errorMessage } from '@/lib/error-message'
import { useProjectPermissions } from '../projects/use-permissions'
import { useUpdateItem } from './use-items'

export function ItemNotesCard({ item }: { item: Item }) {
  const [notes, setNotes] = useState(item.notes ?? '')
  const updateItem = useUpdateItem(item.id)
  const { canEdit } = useProjectPermissions()
  const onError = (error: unknown) => toast.error(errorMessage(error))

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {de.items.tags} &amp; {de.items.notes}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <fieldset disabled={!canEdit} className="grid gap-4">
        <div className="grid gap-1.5">
          <Label>{de.items.tags}</Label>
          <ChipInput
            values={item.tags}
            onChange={(tags) => updateItem.mutate({ tags }, { onError })}
            placeholder={de.items.tagPlaceholder}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="item-notes">{de.items.notes}</Label>
          <Textarea
            id="item-notes"
            rows={6}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={de.items.notesPlaceholder}
          />
          {canEdit && <div>
            <Button
              variant="outline"
              disabled={notes === (item.notes ?? '') || updateItem.isPending}
              onClick={() =>
                updateItem.mutate(
                  { notes: notes.trim() ? notes : null },
                  { onSuccess: () => toast.success(de.items.saved), onError },
                )
              }
            >
              {de.common.save}
            </Button>
          </div>}
        </div>
        </fieldset>
      </CardContent>
    </Card>
  )
}
