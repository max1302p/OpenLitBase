import { de } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@litbase/ui/components/card'
import { toast } from 'sonner'
import { KeyRoundIcon } from 'lucide-react'
import { EmptyState } from '@litbase/ui/components/empty-state'
import { errorMessage } from '@/lib/error-message'
import { CreateTokenForm } from './create-token-form'
import { useDeleteToken, useTokens } from './use-tokens'

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('de-CH', { dateStyle: 'medium' })

export function ApiTokensCard() {
  const tokens = useTokens()
  const deleteToken = useDeleteToken()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{de.tokens.title}</CardTitle>
        <CardDescription>{de.tokens.description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <CreateTokenForm />
        {tokens.data?.length === 0 && (
          <EmptyState size="inline" icon={KeyRoundIcon} title={de.empty.tokensTitle} description={de.empty.tokensDescription} />
        )}
        <ul className="divide-y rounded-md border empty:hidden">
          {tokens.data?.map((token) => (
            <li key={token.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{token.name}</p>
                <p className="text-xs text-muted-foreground">
                  {de.tokens.createdAt(formatDate(token.createdAt))} ·{' '}
                  {de.tokens.lastUsed(token.lastUsedAt && formatDate(token.lastUsedAt))}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  deleteToken.mutate(token.id, {
                    onSuccess: () => toast.success(de.tokens.revoked),
                    onError: (error) => toast.error(errorMessage(error)),
                  })
                }
              >
                {de.tokens.revoke}
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
