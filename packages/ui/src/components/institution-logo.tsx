import { useState } from 'react'
import { cn } from '@litbase/ui/lib/utils'
import { InitialsAvatar } from '@litbase/ui/components/initials-avatar'

interface InstitutionLogoProps {
  name: string
  logoUrl: string | null
  /** Server-Adresse, wenn die Oberfläche nicht auf derselben Origin läuft (Browser-Extension). */
  serverUrl?: string
  className?: string
}

/**
 * Quadratisches Logo der Institution (serverseitig auf Weiss, 1:1) oder ein Initialen-Avatar.
 * `logoUrl` ist ein API-Pfad: Web-App und Add-in laufen auf derselben Origin wie die API, die
 * Extension gibt die Server-Adresse mit. Lädt das Bild nicht, erscheinen ebenfalls die Initialen.
 */
export function InstitutionLogo({ name, logoUrl, serverUrl = '', className }: InstitutionLogoProps) {
  const src = logoUrl && `${serverUrl.replace(/\/$/, '')}${logoUrl}`
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  if (!src || failedSrc === src) return <InitialsAvatar name={name} className={className} />
  return (
    <img
      onError={() => setFailedSrc(src)}
      src={src}
      alt={name}
      className={cn('size-10 shrink-0 rounded-md object-cover', className)}
    />
  )
}
