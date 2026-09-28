import type { ApiClient } from '@litbase/shared'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { readLastProject, writeLastProject } from '../lib/storage'
import { readDocumentProject, storeDocumentProject } from '../word/document-settings'
import { isWord } from '../word/office'

/** Das Dokument merkt sich sein Projekt; sonst gilt das zuletzt gewählte bzw. das erste. */
export function useProjectSelection(api: ApiClient) {
  const projects = useQuery({ queryKey: ['projects'], queryFn: api.listProjects })
  const [chosen, setChosen] = useState(() => (isWord() ? readDocumentProject() : undefined) ?? readLastProject())
  const list = projects.data ?? []
  const projectId = list.some((p) => p.id === chosen) ? chosen : list[0]?.id

  function select(id: string) {
    setChosen(id)
    writeLastProject(id)
    if (isWord()) void storeDocumentProject(id).catch(() => undefined)
  }

  return { projects, projectId, select }
}
