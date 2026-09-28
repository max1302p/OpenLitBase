import { de, type AdminDomain } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@litbase/ui/components/dropdown-menu'
import { BanIcon, CheckIcon, EllipsisIcon, ImageMinusIcon, ImageUpIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@litbase/ui/components/confirm-dialog'
import { errorMessage } from '@/lib/error-message'
import { DomainDialog } from './domain-dialog'
import { useDomainMutations } from './use-admin'

type Dialog = 'edit' | 'deactivate' | 'delete' | null

export function DomainActions({ domain }: { domain: AdminDomain }) {
  const [dialog, setDialog] = useState<Dialog>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const { update, remove, uploadLogo, removeLogo } = useDomainMutations()
  const done = { onSuccess: () => toast.success(de.admin.saved), onError: (e: unknown) => toast.error(errorMessage(e)) }
  const close = (open: boolean) => !open && setDialog(null)

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,.svg"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) uploadLogo.mutate({ id: domain.id, file }, done)
          e.target.value = ''
        }}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={de.items.actions}>
            <EllipsisIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setDialog('edit')}>
            <PencilIcon /> {de.admin.editDomain}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => fileRef.current?.click()}>
            <ImageUpIcon /> {de.admin.uploadLogo}
          </DropdownMenuItem>
          {domain.logoUrl && (
            <DropdownMenuItem onClick={() => removeLogo.mutate(domain.id, done)}>
              <ImageMinusIcon /> {de.admin.removeLogo}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {domain.active ? (
            <DropdownMenuItem onClick={() => setDialog('deactivate')}>
              <BanIcon /> {de.admin.deactivate}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => update.mutate({ id: domain.id, active: true }, done)}>
              <CheckIcon /> {de.admin.activate}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem variant="destructive" onClick={() => setDialog('delete')}>
            <Trash2Icon /> {de.admin.delete}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {dialog === 'edit' && <DomainDialog domain={domain} onOpenChange={close} />}
      <ConfirmDialog
        open={dialog === 'deactivate'}
        onOpenChange={close}
        title={de.admin.deactivateTitle(domain.name)}
        description={de.admin.deactivateDescription(domain.userCount)}
        confirmLabel={de.admin.deactivate}
        destructive
        onConfirm={() => update.mutate({ id: domain.id, active: false }, done)}
      />
      <ConfirmDialog
        open={dialog === 'delete'}
        onOpenChange={close}
        title={de.admin.deleteTitle(domain.name)}
        description={de.admin.deleteDescription}
        confirmLabel={de.admin.delete}
        destructive
        onConfirm={() => remove.mutate(domain.id, { ...done, onSuccess: () => toast.success(de.admin.deleted) })}
      />
    </>
  )
}
