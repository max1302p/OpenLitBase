import { de, type Identifier } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@litbase/ui/components/dialog'
import { ArrowLeftIcon } from 'lucide-react'
import { useState } from 'react'
import { IdentifierStep } from './identifier-step'
import { ImportStep } from './import-step'
import { ManualStep } from './manual-step'
import { MethodChoice, type AddMethod } from './method-choice'

type Step = { method: 'choose' } | { method: AddMethod; prefill?: Identifier }

interface AddItemDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Geführtes Hinzufügen: erst Weg wählen, dann Nummer suchen, manuell erfassen oder importieren.
 * Genau eine Instanz pro Seite, damit der Dialog beim Wechsel „leer → Liste“ offen bleibt.
 */
export function AddItemDialog({ projectId, open, onOpenChange }: AddItemDialogProps) {
  const [step, setStep] = useState<Step>({ method: 'choose' })
  const close = () => handleOpenChange(false)

  function handleOpenChange(next: boolean) {
    onOpenChange(next)
    if (!next) setTimeout(() => setStep({ method: 'choose' }), 200)
  }

  const title = step.method === 'choose' ? de.addItem.title : de.addItem.methods[step.method].title
  const description = step.method === 'choose' ? de.addItem.chooseDescription : de.addItem.methods[step.method].description

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {step.method !== 'choose' && (
              <Button variant="ghost" size="icon-sm" aria-label={de.addItem.back} onClick={() => setStep({ method: 'choose' })}>
                <ArrowLeftIcon />
              </Button>
            )}
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {step.method === 'choose' && <MethodChoice onChoose={(method) => setStep({ method })} />}
        {step.method === 'identifier' && (
          <IdentifierStep
            projectId={projectId}
            onDone={close}
            onManual={(identifier) => setStep({ method: 'manual', prefill: identifier })}
          />
        )}
        {step.method === 'manual' && <ManualStep projectId={projectId} initial={step.prefill} onDone={close} />}
        {step.method === 'import' && <ImportStep projectId={projectId} onDone={close} />}
      </DialogContent>
    </Dialog>
  )
}
