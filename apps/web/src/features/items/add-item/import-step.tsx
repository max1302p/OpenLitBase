import { de, type ImportFormat, type ImportResult } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { cn } from '@litbase/ui/lib/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CircleCheckIcon, FileUpIcon, Loader2Icon, TriangleAlertIcon } from 'lucide-react'
import { useRef, useState, type DragEvent } from 'react'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import { queryKeys } from '@/lib/query-client'

function formatFromFilename(name: string): ImportFormat | undefined {
  const ext = name.toLowerCase().split('.').pop()
  if (ext === 'bib' || ext === 'bibtex') return 'bibtex'
  if (ext === 'ris') return 'ris'
  if (ext === 'enw') return 'endnote'
  if (ext === 'json') return 'csl-json'
  return undefined
}

const isZip = (name: string) => name.toLowerCase().endsWith('.zip')

/** Datei ablegen oder auswählen; Format wird an der Endung erkannt, ZIPs bringen PDFs mit. */
export function ImportStep({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const queryClient = useQueryClient()
  const importItems = useMutation({
    mutationFn: async (file: File): Promise<ImportResult> => {
      if (isZip(file.name)) return api.importZip(file, projectId)
      const format = formatFromFilename(file.name)
      if (!format) throw new Error(de.errors.importFailed)
      return api.importItems({ format, content: await file.text(), projectId })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.items }),
  })

  function handleDrop(event: DragEvent) {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) importItems.mutate(file)
  }

  if (importItems.data) {
    const { imported, skipped, updated, attachments } = importItems.data
    return (
      <div className="grid gap-4">
        <div className="grid gap-2 rounded-xl border bg-accent/40 p-4 text-sm">
          <p className="flex items-center gap-2 font-medium text-primary">
            <CircleCheckIcon className="size-4" /> {de.addItem.importDone}
          </p>
          <p>{de.addItem.importedCount(imported)}</p>
          {attachments > 0 && <p>{de.addItem.attachmentsCount(attachments)}</p>}
          {skipped > 0 && <p className="text-muted-foreground">{de.addItem.skippedCount(skipped)}</p>}
          {updated > 0 && <p className="text-muted-foreground">{de.addItem.updatedCount(updated)}</p>}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => importItems.reset()}>
            {de.addItem.importAnother}
          </Button>
          <Button onClick={onDone}>{de.addItem.done}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => (e.preventDefault(), setDragging(true))}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        disabled={importItems.isPending}
        className={cn(
          'flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors hover:border-primary/50 hover:bg-accent/50',
          dragging && 'border-primary bg-accent',
        )}
      >
        {importItems.isPending ? (
          <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
        ) : (
          <FileUpIcon className="size-8 text-muted-foreground" />
        )}
        <span className="font-medium">{importItems.isPending ? de.addItem.importing : de.addItem.dropTitle}</span>
        <span className="max-w-sm text-xs text-muted-foreground">{de.addItem.dropHint}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".bib,.bibtex,.ris,.enw,.json,.zip"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) importItems.mutate(file)
          e.target.value = ''
        }}
      />
      {importItems.isError && (
        <p className="flex items-center gap-2 text-sm text-destructive">
          <TriangleAlertIcon className="size-4" />
          {importItems.error instanceof Error && !('status' in importItems.error)
            ? importItems.error.message
            : errorMessage(importItems.error)}
        </p>
      )}
    </div>
  )
}
