import { de, isSharedProject, triadSentence, type Project } from '@litbase/shared'
import { BookOpenTextIcon, LibraryBigIcon, ListChecksIcon, TableIcon } from 'lucide-react'
import { useState } from 'react'
import { PeopleStack } from '@/components/people-stack'
import { PageBody } from '../app-shell/page-body'
import { PageHeader } from '../app-shell/page-header'
import { useStyleTitle } from '../citation/use-styles'
import { useItems } from '../items/use-items'
import { useProjectPermissions } from '../projects/use-permissions'
import { useActiveProject, useBibliography } from '../projects/use-projects'
import { isFilled, useProtocol } from '../protocol/use-protocol'
import { ShareButton } from '../sharing/share-button'
import { useTermMatrixData } from '../term-matrix/use-term-matrix'
import { ResearchAssistant } from './assistant/research-assistant'
import { NextSteps } from './next-steps'
import { RecentItems } from './recent-items'
import { ResearchCard } from './research-card'
import { StatTiles } from './stat-tiles'
import { TeamCard } from './team-card'

const dateFormat = new Intl.DateTimeFormat('de-CH', { dateStyle: 'long' })

/** Startseite eines Projekts: Forschungsdreisatz, nächste Schritte, Kennzahlen, zuletzt Hinzugefügtes. */
export function ProjectOverviewPage() {
  const { project } = useActiveProject()
  return project ? <Overview key={project.id} project={project} /> : null
}

function Overview({ project }: { project: Project }) {
  const { canEdit } = useProjectPermissions()
  const [assistant, setAssistant] = useState(false)
  const items = useItems(project.id).data ?? []
  const protocolEntries = useProtocol(project.id).data?.entries ?? []
  const classified = protocolEntries.filter((e) => isFilled(e.protocol)).length
  const matrix = useTermMatrixData(project.id).data
  const styleTitle = useStyleTitle(useBibliography(project.id).data?.styleId)
  const base = `/projects/${project.id}`
  const shared = isSharedProject(project)
  const terms = matrix?.columns.reduce((sum, c) => sum + Object.values(c.cells).reduce((n, t) => n + (t?.length ?? 0), 0), 0) ?? 0
  const openAssistant = canEdit ? () => setAssistant(true) : undefined
  const s = de.overview.stats

  return (
    <>
      <PageHeader title={de.nav.overview} actions={<ShareButton />} />
      <PageBody>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="grid gap-1">
            <h2 className="text-2xl font-semibold tracking-tight">{project.name}</h2>
            <p className="text-sm text-muted-foreground">
              {de.overview.createdAt(dateFormat.format(new Date(project.createdAt)))}
              {shared && ` · ${de.sharing.sharedWith(project.people.length - 1)}`}
            </p>
          </div>
          {shared && <PeopleStack people={project.people} max={6} />}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <ResearchCard className="lg:col-span-2" research={project.research} canEdit={canEdit} onOpenAssistant={() => setAssistant(true)} />
          <NextSteps
            steps={[
              { label: de.overview.next.triad, done: Boolean(triadSentence(project.research)), onClick: openAssistant },
              { label: de.overview.next.question, done: Boolean(project.research.question), onClick: openAssistant },
              { label: de.overview.next.matrix, done: terms > 0, to: `${base}/matrix` },
              { label: de.overview.next.protocol, done: classified > 0, to: `${base}/protocol` },
              { label: de.overview.next.items, done: items.length > 0, to: `${base}/items` },
            ]}
          />
        </div>

        <StatTiles
          tiles={[
            { to: `${base}/items`, icon: LibraryBigIcon, label: s.items, value: String(items.length), hint: s.itemsHint },
            { to: `${base}/bibliography`, icon: BookOpenTextIcon, label: s.bibliography, value: styleTitle ?? '–', hint: de.projects.citationStyle },
            { to: `${base}/protocol`, icon: ListChecksIcon, label: s.protocol, value: `${classified}/${protocolEntries.length}`, hint: s.protocolHint },
            { to: `${base}/matrix`, icon: TableIcon, label: s.matrix, value: s.topics(matrix?.columns.length ?? 0), hint: s.matrixHint(terms) },
          ]}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <RecentItems projectId={project.id} items={items} className={shared ? 'lg:col-span-2' : 'lg:col-span-3'} />
          {shared && <TeamCard people={project.people} />}
        </div>
      </PageBody>
      <ResearchAssistant projectId={project.id} research={project.research} open={assistant} onOpenChange={setAssistant} />
    </>
  )
}
