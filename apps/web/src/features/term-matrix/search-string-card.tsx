import { buildSearchString, de, type SearchStringRow, type TermMatrixData } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@litbase/ui/components/card'
import { Checkbox } from '@litbase/ui/components/checkbox'
import { Label } from '@litbase/ui/components/label'
import { CopyIcon } from 'lucide-react'
import { toast } from 'sonner'

export const searchStringRowOptions: SearchStringRow[] = ['title', 'synonyms', 'broader', 'narrower', 'related', 'opposite', 'english']

interface SearchStringCardProps {
  data: TermMatrixData
  rows: SearchStringRow[]
  onRowsChange: (rows: SearchStringRow[]) => void
}

export function SearchStringCard({ data, rows, onRowsChange }: SearchStringCardProps) {
  const searchString = buildSearchString(data, rows)

  async function copy() {
    await navigator.clipboard.writeText(searchString)
    toast.success(de.termMatrix.copied)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{de.termMatrix.searchString}</CardTitle>
        <CardDescription>{de.termMatrix.searchStringDescription}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {searchStringRowOptions.map((row) => (
            <Label key={row} className="font-normal">
              <Checkbox
                checked={rows.includes(row)}
                onCheckedChange={(on) => onRowsChange(on ? searchStringRowOptions.filter((r) => r === row || rows.includes(r)) : rows.filter((r) => r !== row))}
              />
              {de.termMatrix.rows[row]}
            </Label>
          ))}
        </div>
        <div className="flex items-start gap-2">
          <pre className="min-h-10 flex-1 whitespace-pre-wrap break-words rounded-lg border bg-muted/40 p-3 font-mono text-sm">
            {searchString || <span className="font-sans text-muted-foreground">{de.termMatrix.searchStringEmpty}</span>}
          </pre>
          <Button variant="outline" disabled={!searchString} onClick={() => void copy()}>
            <CopyIcon /> {de.termMatrix.copy}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
