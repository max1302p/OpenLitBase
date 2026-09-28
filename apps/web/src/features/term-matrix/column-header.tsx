import { de, type TermMatrixColumn } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { ConfirmDialog } from '@litbase/ui/components/confirm-dialog'
import { Input } from '@litbase/ui/components/input'
import { Trash2Icon } from 'lucide-react'
import { useState } from 'react'

interface ColumnHeaderProps {
  column: TermMatrixColumn
  onRename: (title: string) => void
  onRemove: () => void
}

/** Spaltenkopf: Hauptbegriff direkt editierbar, Entfernen mit Rückfrage. */
export function ColumnHeader({ column, onRename, onRemove }: ColumnHeaderProps) {
  const [confirm, setConfirm] = useState(false)
  return (
    <div className="flex items-center gap-1">
      <Input
        value={column.title}
        onChange={(e) => onRename(e.target.value)}
        placeholder={de.termMatrix.columnPlaceholder}
        className="h-8 font-semibold"
        aria-label={de.termMatrix.columnPlaceholder}
      />
      <Button variant="ghost" size="icon" className="size-8 shrink-0 text-muted-foreground" aria-label={de.termMatrix.removeColumn} onClick={() => setConfirm(true)}>
        <Trash2Icon />
      </Button>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={de.termMatrix.removeColumnTitle}
        description={de.termMatrix.removeColumnDescription(column.title || de.termMatrix.columnPlaceholder)}
        confirmLabel={de.termMatrix.removeColumn}
        destructive
        onConfirm={onRemove}
      />
    </div>
  )
}
