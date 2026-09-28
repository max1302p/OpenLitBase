import { de } from '@litbase/shared'
import { Badge } from '@litbase/ui/components/badge'
import { Button } from '@litbase/ui/components/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@litbase/ui/components/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@litbase/ui/components/table'
import { Building2Icon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '@litbase/ui/components/empty-state'
import { InstitutionLogo } from '@litbase/ui/components/institution-logo'
import { DomainActions } from './domain-actions'
import { DomainDialog } from './domain-dialog'
import { useAdminDomains } from './use-admin'

export function DomainsPanel() {
  const domains = useAdminDomains()
  const [creating, setCreating] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{de.admin.tabDomains}</CardTitle>
        <CardDescription>{de.admin.domainsDescription}</CardDescription>
        <CardAction>
          <Button onClick={() => setCreating(true)}>
            <PlusIcon /> {de.admin.addDomain}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {domains.data?.length === 0 ? (
          <EmptyState
            size="inline"
            icon={Building2Icon}
            title={de.empty.domainsTitle}
            description={de.empty.domainsDescription}
            action={
              <Button onClick={() => setCreating(true)}>
                <PlusIcon /> {de.admin.addDomain}
              </Button>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">{de.admin.logo}</TableHead>
                  <TableHead>{de.admin.name}</TableHead>
                  <TableHead>{de.admin.domain}</TableHead>
                  <TableHead className="text-right">{de.admin.users}</TableHead>
                  <TableHead>{de.admin.status}</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.data?.map((domain) => (
                  <TableRow key={domain.id} className={domain.active ? undefined : 'opacity-60'}>
                    <TableCell>
                      <InstitutionLogo name={domain.name} logoUrl={domain.logoUrl} className="size-9" />
                    </TableCell>
                    <TableCell className="font-medium">{domain.name}</TableCell>
                    <TableCell className="font-mono text-xs">{domain.domain}</TableCell>
                    <TableCell className="text-right tabular-nums">{domain.userCount}</TableCell>
                    <TableCell>
                      <Badge variant={domain.active ? 'default' : 'outline'}>
                        {domain.active ? de.admin.active : de.admin.inactive}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DomainActions domain={domain} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          {de.admin.logo}: {de.admin.logoHint}
        </p>
      </CardContent>
      {creating && <DomainDialog onOpenChange={setCreating} />}
    </Card>
  )
}
