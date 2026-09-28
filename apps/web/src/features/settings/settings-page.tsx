import { de } from '@litbase/shared'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@litbase/ui/components/card'
import { toast } from 'sonner'
import { errorMessage } from '@/lib/error-message'
import { PageBody } from '../app-shell/page-body'
import { PageHeader } from '../app-shell/page-header'
import { useConfig } from '../auth/use-session'
import { BookmarkletCard } from '../bookmarklet/bookmarklet-card'
import { StyleSelect } from '../citation/style-select'
import { useSettings, useUpdateSettings } from '../citation/use-styles'
import { ApiTokensCard } from './api-tokens-card'
import { ChangePasswordCard } from './change-password-card'
import { DeleteAccountCard } from './delete-account-card'
import { McpCard } from './mcp-card'
import { VersionCard } from './version-card'

export function SettingsPage() {
  const settings = useSettings()
  const updateSettings = useUpdateSettings()
  // Im Modus "single" verbinden sich Extension und Add-in ohne Token.
  const isMulti = useConfig().data?.authMode === 'multi'

  return (
    <>
      <PageHeader title={de.settings.title} />
      <PageBody>
        <Card>
          <CardHeader>
            <CardTitle>{de.settings.citationTitle}</CardTitle>
            <CardDescription>{de.settings.citationDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            {settings.data && (
              <StyleSelect
                value={settings.data.citationStyle}
                onChange={(citationStyle) =>
                  updateSettings.mutate(
                    { citationStyle },
                    {
                      onSuccess: () => toast.success(de.settings.saved),
                      onError: (error) => toast.error(errorMessage(error)),
                    },
                  )
                }
              />
            )}
          </CardContent>
        </Card>
        {isMulti && <ChangePasswordCard />}
        {isMulti && <ApiTokensCard />}
        <BookmarkletCard />
        <McpCard needsToken={isMulti} />
        <VersionCard />
        {isMulti && <DeleteAccountCard />}
      </PageBody>
    </>
  )
}
