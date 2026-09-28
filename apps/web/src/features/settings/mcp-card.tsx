import { de } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@litbase/ui/components/card'
import { CopyIcon } from 'lucide-react'
import { toast } from 'sonner'

function CopyLine({ label, value }: { label: string; value: string }) {
  async function copy() {
    await navigator.clipboard.writeText(value)
    toast.success(de.mcp.copied)
  }

  return (
    <div className="grid gap-1.5">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex gap-2">
        <code className="min-w-0 flex-1 truncate rounded bg-muted px-2 py-1.5 font-mono text-xs" title={value}>
          {value}
        </code>
        <Button variant="outline" size="sm" onClick={() => void copy()}>
          <CopyIcon /> {de.mcp.copy}
        </Button>
      </div>
    </div>
  )
}

/** Adresse des MCP-Endpunkts; im Modus `multi` mit API-Token (`needsToken`). */
export function McpCard({ needsToken }: { needsToken: boolean }) {
  const url = `${window.location.origin}/api/mcp`
  const header = needsToken ? ' --header "Authorization: Bearer <TOKEN>"' : ''

  return (
    <Card>
      <CardHeader>
        <CardTitle>{de.mcp.title}</CardTitle>
        <CardDescription>{de.mcp.description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <CopyLine label={de.mcp.urlLabel} value={url} />
        <CopyLine label={de.mcp.commandLabel} value={`claude mcp add --transport http openlitbase ${url}${header}`} />
        {needsToken && <p className="text-sm text-muted-foreground">{de.mcp.tokenHint}</p>}
      </CardContent>
    </Card>
  )
}
