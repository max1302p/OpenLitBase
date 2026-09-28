import { de, type Bibliography } from '@litbase/shared'
import { Button } from '@litbase/ui/components/button'
import { BookOpenTextIcon, CopyIcon, FileDownIcon, LibraryBigIcon } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { EmptyState } from '@litbase/ui/components/empty-state'
import { api } from '@/lib/api'
import { useStyleTitle } from '../citation/use-styles'
import { useBibliography } from './use-projects'

/** Kopiert als HTML (Formatierung bleibt in Word erhalten) und als Klartext. */
async function copyBibliography(bibliography: Bibliography) {
  const html = bibliography.entries.map((e) => e.html).join('')
  const text = bibliography.entries.map((e) => e.text).join('\n')
  if (typeof ClipboardItem !== 'undefined') {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' }),
      }),
    ])
  } else {
    await navigator.clipboard.writeText(text)
  }
  toast.success(de.bibliography.copied)
}

export function BibliographyPanel({ projectId }: { projectId: string }) {
  const bibliography = useBibliography(projectId)
  if (bibliography.isSuccess && bibliography.data.entries.length === 0) {
    return (
      <EmptyState
        icon={BookOpenTextIcon}
        title={de.empty.bibliographyTitle}
        description={de.empty.bibliographyDescription}
        action={
          <Button asChild>
            <Link to={`/projects/${projectId}/items`}>
              <LibraryBigIcon /> {de.empty.toItems}
            </Link>
          </Button>
        }
      />
    )
  }
  return <BibliographyContent projectId={projectId} />
}

function BibliographyContent({ projectId }: { projectId: string }) {
  const bibliography = useBibliography(projectId)
  const styleTitle = useStyleTitle(bibliography.data?.styleId)
  const entries = bibliography.data?.entries ?? []
  const exports = [
    { format: 'docx', label: de.bibliography.exportDocx },
    { format: 'markdown', label: de.bibliography.exportMarkdown },
    { format: 'bibtex', label: de.bibliography.exportBibtex },
  ] as const

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-auto text-sm text-muted-foreground">{styleTitle && de.bibliography.style(styleTitle)}</span>
        <Button variant="outline" disabled={entries.length === 0} onClick={() => void copyBibliography(bibliography.data!)}>
          <CopyIcon /> {de.bibliography.copy}
        </Button>
        {exports.map(({ format, label }) => (
          <Button key={format} variant="outline" asChild disabled={entries.length === 0}>
            <a href={api.urls.bibliographyExport(projectId, format)} download>
              <FileDownIcon /> {label}
            </a>
          </Button>
        ))}
      </div>
      <div className="csl-bibliography rounded-xl border p-6 text-sm leading-relaxed lg:p-8">
        {bibliography.isPending && <p className="text-muted-foreground">{de.common.loading}</p>}
        {/* citeproc-js maskiert Metadaten selbst und erzeugt nur Formatierungs-Tags. */}
        {entries.map((entry) => (
          <div key={entry.id} className="mb-2" dangerouslySetInnerHTML={{ __html: entry.html }} />
        ))}
      </div>
    </div>
  )
}
