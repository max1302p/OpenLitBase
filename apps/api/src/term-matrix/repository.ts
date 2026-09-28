import type { TermMatrixData } from '@litbase/shared'
import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { termMatrix } from '../db/schema'

/** Eine Matrix pro Projekt; ohne Eintrag eine leere. Das Projekt muss vorher geprüft sein. */
export async function getTermMatrix(projectId: string): Promise<TermMatrixData> {
  const [row] = await db.select({ data: termMatrix.data }).from(termMatrix).where(eq(termMatrix.projectId, projectId))
  return row?.data ?? { columns: [] }
}

export async function saveTermMatrix(projectId: string, data: TermMatrixData) {
  await db
    .insert(termMatrix)
    .values({ projectId, data })
    .onConflictDoUpdate({ target: termMatrix.projectId, set: { data } })
  return data
}
