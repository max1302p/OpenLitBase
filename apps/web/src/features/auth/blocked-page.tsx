import { de } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { useQueryClient } from '@tanstack/react-query'
import { LogOutIcon } from 'lucide-react'
import { useNavigate } from 'react-router'
import { authClient } from '@/lib/auth-client'
import { AuthLayout } from './auth-layout'

/** Angemeldet, aber gesperrt (Institution deaktiviert). */
export function BlockedPage({ message }: { message: string }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  async function signOut() {
    await authClient.signOut()
    queryClient.clear()
    void navigate('/login', { replace: true })
  }

  return (
    <AuthLayout title={de.auth.blockedTitle} description={message}>
      <Button variant="outline" onClick={() => void signOut()}>
        <LogOutIcon /> {de.auth.signOut}
      </Button>
    </AuthLayout>
  )
}
