import { de, type AdminDomain } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@litbase/ui/components/dialog'
import { Input } from '@litbase/ui/components/input'
import { Label } from '@litbase/ui/components/label'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/lib/error-message'
import { useDomainMutations } from './use-admin'

interface DomainDialogProps {
  /** Ohne Domain: neu anlegen. */
  domain?: AdminDomain
  onOpenChange: (open: boolean) => void
}

export function DomainDialog({ domain, onOpenChange }: DomainDialogProps) {
  const [values, setValues] = useState({ domain: domain?.domain ?? '', name: domain?.name ?? '' })
  const { create, update } = useDomainMutations()
  const pending = create.isPending || update.isPending

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const options = {
      onSuccess: () => {
        toast.success(de.admin.saved)
        onOpenChange(false)
      },
      onError: (error: unknown) => toast.error(errorMessage(error)),
    }
    if (domain) update.mutate({ id: domain.id, ...values }, options)
    else create.mutate(values, options)
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{domain ? de.admin.editDomain : de.admin.addDomain}</DialogTitle>
            <DialogDescription>{de.admin.domainsDescription}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="domain-domain">{de.admin.domain}</Label>
            <Input
              id="domain-domain"
              value={values.domain}
              onChange={(e) => setValues({ ...values, domain: e.target.value })}
              placeholder={de.admin.domainPlaceholder}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="domain-name">{de.admin.name}</Label>
            <Input
              id="domain-name"
              value={values.name}
              onChange={(e) => setValues({ ...values, name: e.target.value })}
              placeholder={de.admin.namePlaceholder}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {de.common.cancel}
            </Button>
            <Button type="submit" disabled={pending || !values.domain.trim() || !values.name.trim()}>
              {de.common.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
