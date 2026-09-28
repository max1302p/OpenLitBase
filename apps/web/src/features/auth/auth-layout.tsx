import { BrandLogo } from '@litbase/ui/components/brand-logo'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@litbase/ui/components/card'
import type { ReactNode } from 'react'
import { LegalLinks } from './legal-links'

interface AuthLayoutProps {
  title: string
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
}

/** Zentrierte Karte mit Logo für Login, Registrierung und Passwort-Reset. */
export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-sidebar p-6">
      <BrandLogo className="h-8" />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
      {footer}
      <LegalLinks />
    </div>
  )
}
