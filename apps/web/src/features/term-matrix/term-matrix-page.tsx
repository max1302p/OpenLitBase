import { de, defaultSearchStringRows, termMatrixExportFormats, type SearchStringRow } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { EmptyState } from '@litbase/ui/components/empty-state'
import { PlusIcon, TableIcon } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router'
import { DownloadMenu } from '@/components/download-menu'
import { api } from '@/lib/api'
import { PageBody } from '../app-shell/page-body'
import { PageHeader } from '../app-shell/page-header'
import { useProjectPermissions } from '../projects/use-permissions'
import { SearchStringCard } from './search-string-card'
import { TermMatrixGrid } from './term-matrix-grid'
import { useTermMatrix } from './use-term-matrix'

const exportLabels = { docx: de.termMatrix.exportDocx, markdown: de.termMatrix.exportMarkdown }

export function TermMatrixPage() {
  const { projectId = '' } = useParams()
  // Neu mounten beim Projektwechsel, damit kein Entwurf ins andere Projekt wandert.
  return <TermMatrix key={projectId} projectId={projectId} />
}

function TermMatrix({ projectId }: { projectId: string }) {
  const { data, change, saving } = useTermMatrix(projectId)
  const [rows, setRows] = useState<SearchStringRow[]>(defaultSearchStringRows)
  const { canEdit } = useProjectPermissions()
  const columns = data?.columns ?? []

  function addColumn() {
    change({ columns: [...columns, { id: crypto.randomUUID(), title: de.termMatrix.newColumn(columns.length + 1), cells: {} }] })
  }

  return (
    <>
      <PageHeader
        title={de.nav.termMatrix}
        actions={
          <>
            {columns.length > 0 && canEdit && (
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {saving ? de.termMatrix.saving : de.termMatrix.savedState}
              </span>
            )}
            <DownloadMenu
              label={de.importExport.export}
              disabled={columns.length === 0}
              options={termMatrixExportFormats.map((format) => ({
                label: exportLabels[format],
                href: api.urls.termMatrixExport(projectId, format, rows),
              }))}
            />
          </>
        }
      />
      <PageBody>
        {data && columns.length === 0 ? (
          <EmptyState
            icon={TableIcon}
            title={de.empty.termMatrixTitle}
            description={de.empty.termMatrixDescription}
            action={
              canEdit && (
                <Button onClick={addColumn}>
                  <PlusIcon /> {de.termMatrix.create}
                </Button>
              )
            }
          />
        ) : (
          data && (
            <>
              <TermMatrixGrid data={data} onChange={change} onAddColumn={addColumn} readOnly={!canEdit} />
              {canEdit && <p className="-mt-3 text-xs text-muted-foreground">{de.termMatrix.truncateHint}</p>}
              <SearchStringCard data={data} rows={rows} onRowsChange={setRows} />
            </>
          )
        )}
      </PageBody>
    </>
  )
}
