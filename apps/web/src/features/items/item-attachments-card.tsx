import { de, type Item } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@litbase/ui/components/card'
import { FileTextIcon, Loader2Icon, PaperclipIcon, UploadIcon, XIcon } from 'lucide-react'
import { useRef } from 'react'
import { toast } from 'sonner'
import { EmptyState } from '@litbase/ui/components/empty-state'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import { useProjectPermissions } from '../projects/use-permissions'
import { useDeleteAttachment, useUploadAttachment } from './use-items'

export function ItemAttachmentsCard({ item }: { item: Item }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const upload = useUploadAttachment(item.id)
  const { canEdit } = useProjectPermissions()
  const remove = useDeleteAttachment()
  const onError = (error: unknown) => toast.error(errorMessage(error))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{de.items.attachments}</CardTitle>
        {canEdit && <CardAction>
          <Button variant="outline" size="sm" disabled={upload.isPending} onClick={() => inputRef.current?.click()}>
            {upload.isPending ? <Loader2Icon className="animate-spin" /> : <UploadIcon />} {de.items.uploadPdf}
          </Button>
        </CardAction>}
      </CardHeader>
      <CardContent>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) upload.mutate(file, { onSuccess: () => toast.success(de.items.uploaded), onError })
            e.target.value = ''
          }}
        />
        {item.attachments.length === 0 && (
          <EmptyState
            size="inline"
            icon={PaperclipIcon}
            title={de.empty.attachmentsTitle}
            description={de.empty.attachmentsDescription}
          />
        )}
        <ul className="grid gap-1">
          {item.attachments.map((attachment) => (
            <li key={attachment.id} className="flex items-center gap-2 text-sm">
              <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
              <a
                href={api.urls.attachment(attachment.id)}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 flex-1 truncate underline-offset-4 hover:underline"
              >
                {attachment.filename}
              </a>
              {canEdit && <Button
                variant="ghost"
                size="icon-xs"
                aria-label={de.items.removeAttachment}
                onClick={() => remove.mutate(attachment.id, { onError })}
              >
                <XIcon />
              </Button>}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
