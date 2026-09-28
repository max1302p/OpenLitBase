import { de } from '@litbase/shared'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@litbase/ui/components/tabs'
import { Navigate, useSearchParams } from 'react-router'
import { nextPath } from '@/lib/next-path'
import { FullPageMessage } from '../app-shell/full-page-message'
import { authErrorMessage } from './auth-error'
import { AuthLayout } from './auth-layout'
import { InstitutionList } from './institution-list'
import { SignInForm } from './sign-in-form'
import { SignUpForm } from './sign-up-form'
import { useConfig, useMe } from './use-session'

export function LoginPage() {
  const config = useConfig()
  const me = useMe()
  const [searchParams, setSearchParams] = useSearchParams()
  const mode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin'
  const linkError = searchParams.get('error')

  if (config.isPending || me.isPending) return <FullPageMessage>{de.common.loading}</FullPageMessage>
  // Ohne Login-Modus bzw. schon angemeldet (z. B. nach Klick auf den Bestätigungslink) → App.
  if (config.data?.authMode === 'single' || me.isSuccess) return <Navigate to={nextPath(searchParams.get('next'))} replace />

  return (
    <AuthLayout
      title={de.auth.welcome}
      description={
        linkError ? <span className="text-destructive">{authErrorMessage({ code: linkError })}</span> : de.auth.tagline
      }
      footer={<InstitutionList />}
    >
      <Tabs value={mode} onValueChange={(value) => setSearchParams((params) => (value === 'signup' ? params.set('mode', 'signup') : params.delete('mode'), params))}>
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="signin">{de.auth.signIn}</TabsTrigger>
          <TabsTrigger value="signup">{de.auth.signUp}</TabsTrigger>
        </TabsList>
        <TabsContent value="signin">
          <SignInForm />
        </TabsContent>
        <TabsContent value="signup">
          <SignUpForm />
        </TabsContent>
      </Tabs>
    </AuthLayout>
  )
}
