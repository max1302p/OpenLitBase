import { de, protocolExportFormats, type Project } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@litbase/ui/components/card'
import { EmptyState } from '@litbase/ui/components/empty-state'
import { LibraryBigIcon } from 'lucide-react'
import { Link } from 'react-router'
import { DownloadMenu } from '@/components/download-menu'
import { api } from '@/lib/api'
import { PageBody } from '../app-shell/page-body'
import { PageHeader } from '../app-shell/page-header'
import { useItems } from '../items/use-items'
import { TriadSentence } from '../overview/triad-sentence'
import { useProjectPermissions } from '../projects/use-permissions'
import { useActiveProject } from '../projects/use-projects'
import { useTermMatrixData } from '../term-matrix/use-term-matrix'
import { ProtocolMatrix } from './protocol-matrix'
import { ProtocolTitles } from './protocol-titles'
import { useProtocol } from './use-protocol'

const labels = { docx: de.protocol.download, markdown: de.protocol.downloadMarkdown }

/** Rechercheprotokoll wie die Vorlage: Dreisatz, Begriffsmatrix, Titelliste, Bibliografie. */
export function ProtocolPage() {
  const { project } = useActiveProject()
  return project ? <ProtocolView key={project.id} project={project} /> : null
}

function ProtocolView({ project }: { project: Project }) {
  const { canEdit } = useProjectPermissions()
  const protocol = useProtocol(project.id)
  const items = useItems(project.id).data ?? []
  const matrix = useTermMatrixData(project.id).data
  const base = `/projects/${project.id}`
  const hasTriad = Boolean(project.research.topic || project.research.knowledgeGoal || project.research.relevance)
  const t = de.protocol

  return (
    <>
      <PageHeader
        title={de.nav.protocol}
        actions={
          <DownloadMenu
            label={de.importExport.export}
            options={protocolExportFormats.map((format) => ({ label: labels[format], href: api.urls.protocolExport(project.id, format) }))}
          />
        }
      />
      <PageBody>
        <p className="-mt-2 text-sm text-muted-foreground">{t.description}</p>

        <Card>
          <CardHeader>
            <CardTitle>{t.triad}</CardTitle>
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <Link to={base}>{t.editTriad}</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-3">
            {hasTriad ? <TriadSentence research={project.research} /> : <p className="text-sm text-muted-foreground">{t.triadMissing}</p>}
            {project.research.question && (
              <p className="text-sm">
                <span className="font-medium">{t.question}:</span> {project.research.question}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.matrix}</CardTitle>
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <Link to={`${base}/matrix`}>{t.editMatrix}</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>{matrix && <ProtocolMatrix matrix={matrix} />}</CardContent>
        </Card>

        <section className="grid gap-3">
          <div className="grid gap-0.5">
            <h2 className="font-semibold">{t.titles}</h2>
            <p className="text-sm text-muted-foreground">{t.titlesHint}</p>
          </div>
          {protocol.data?.entries.length === 0 ? (
            <EmptyState
              size="inline"
              icon={LibraryBigIcon}
              title={de.empty.protocolTitle}
              description={de.empty.protocolDescription}
              className="rounded-xl border border-dashed"
            />
          ) : (
            protocol.data && (
              <ProtocolTitles projectId={project.id} entries={protocol.data.entries} items={items} readOnly={!canEdit} />
            )
          )}
        </section>

        {protocol.data && protocol.data.entries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t.bibliography}</CardTitle>
            </CardHeader>
            <CardContent className="csl-bibliography grid gap-2 text-sm">
              {/* citeproc-js maskiert Metadaten selbst und erzeugt nur Formatierungs-Tags. */}
              {protocol.data.entries.map((entry) => (
                <div key={entry.itemId} dangerouslySetInnerHTML={{ __html: entry.reference }} />
              ))}
            </CardContent>
          </Card>
        )}
      </PageBody>
    </>
  )
}
