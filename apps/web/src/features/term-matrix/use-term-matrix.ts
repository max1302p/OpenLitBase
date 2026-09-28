import type { TermMatrixData } from '@litbase/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import { queryKeys } from '@/lib/query-client'

const SAVE_DELAY_MS = 600

/**
 * Matrix lokal bearbeiten und kurz nach der letzten Änderung speichern (kein Speichern-Knopf).
 * Beim Verlassen der Seite wird eine ausstehende Änderung sofort gespeichert.
 */
export function useTermMatrix(projectId: string) {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: queryKeys.termMatrix(projectId), queryFn: () => api.getTermMatrix(projectId) })
  const [draft, setDraft] = useState<TermMatrixData>()
  const [dirty, setDirty] = useState(false)
  const pending = useRef<TermMatrixData | undefined>(undefined)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const save = useMutation({
    mutationFn: (data: TermMatrixData) => api.saveTermMatrix(projectId, data),
    onSuccess: (data) => queryClient.setQueryData(queryKeys.termMatrix(projectId), data),
    onError: (error) => toast.error(errorMessage(error)),
  })
  const saveRef = useRef(save.mutate)
  saveRef.current = save.mutate

  function flush() {
    clearTimeout(timer.current)
    if (!pending.current) return
    saveRef.current(pending.current, { onSettled: () => setDirty(false) })
    pending.current = undefined
  }

  function change(next: TermMatrixData) {
    setDraft(next)
    setDirty(true)
    pending.current = next
    clearTimeout(timer.current)
    timer.current = setTimeout(flush, SAVE_DELAY_MS)
  }

  useEffect(() => () => flush(), []) // eslint-disable-line react-hooks/exhaustive-deps

  return { data: draft ?? query.data, isPending: query.isPending, change, saving: dirty || save.isPending }
}

/** Nur lesen (z. B. Kennzahlen auf der Übersicht) – teilt sich den Cache mit der Matrix-Seite. */
export function useTermMatrixData(projectId: string) {
  return useQuery({ queryKey: queryKeys.termMatrix(projectId), queryFn: () => api.getTermMatrix(projectId) })
}
