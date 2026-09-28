import { de, type AdminUserStatus } from '@litbase/shared'
import { Badge } from '@litbase/ui/components/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@litbase/ui/components/card'
import { Input } from '@litbase/ui/components/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@litbase/ui/components/table'
import { useState } from 'react'
import { UsersIcon } from 'lucide-react'
import { EmptyState } from '@litbase/ui/components/empty-state'
import { UserAvatar } from '@litbase/ui/components/user-avatar'
import { useAdminUsers } from './use-admin'

const STATUS_VARIANT: Record<AdminUserStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  active: 'secondary',
  admin: 'default',
  unverified: 'outline',
  blocked: 'destructive',
}

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('de-CH', { dateStyle: 'medium', timeStyle: 'short' }) : de.admin.never

/** Alle Konten, nur lesend. */
export function UsersPanel() {
  const users = useAdminUsers()
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const list = (users.data ?? []).filter((u) => !q || `${u.name} ${u.email}`.toLowerCase().includes(q))
  const c = de.admin.columns

  return (
    <Card>
      <CardHeader>
        <CardTitle>{de.admin.tabUsers}</CardTitle>
        <CardDescription>{de.admin.usersDescription}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={de.admin.searchUsers} className="max-w-sm" />
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{c.name}</TableHead>
                <TableHead>{c.institution}</TableHead>
                <TableHead>{c.status}</TableHead>
                <TableHead>{c.createdAt}</TableHead>
                <TableHead>{c.lastSignIn}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="whitespace-normal">
                    {users.isPending ? (
                      <p className="py-8 text-center text-muted-foreground">{de.common.loading}</p>
                    ) : (
                      <EmptyState
                        size="inline"
                        icon={UsersIcon}
                        title={q ? de.empty.noMatchesTitle : de.empty.usersTitle}
                        description={q ? de.empty.usersNoMatch : de.empty.usersDescription}
                      />
                    )}
                  </TableCell>
                </TableRow>
              )}
              {list.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserAvatar userId={user.id} name={user.name} />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{user.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.institution ?? '–'}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[user.status]}>{de.admin.userStatus[user.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-xs">{formatDate(user.lastSignInAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
