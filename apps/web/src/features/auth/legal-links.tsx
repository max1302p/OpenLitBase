import { de } from '@litbase/shared'
import { cn } from '@litbase/ui/lib/utils'
import { useConfig } from './use-session'

/** Links auf die Rechtstexte der Betreiberin (LEGAL_*); ohne Angaben nichts. */
export function useLegalLinks() {
  const legal = useConfig().data?.legal
  const links: { label: string; url: string | null | undefined }[] = [
    { label: de.legal.privacy, url: legal?.privacyUrl },
    { label: de.legal.terms, url: legal?.termsUrl },
    { label: de.legal.imprint, url: legal?.imprintUrl },
    { label: de.legal.source, url: useConfig().data?.sourceUrl },
  ]
  return links.filter((l): l is { label: string; url: string } => Boolean(l.url))
}

export function LegalLinks({ className }: { className?: string }) {
  const links = useLegalLinks()
  if (links.length === 0) return null
  return (
    <nav className={cn('flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground', className)}>
      {links.map((l) => (
        <a key={l.url} href={l.url} target="_blank" rel="noopener" className="underline-offset-4 hover:text-foreground hover:underline">
          {l.label}
        </a>
      ))}
    </nav>
  )
}
