import { BUILTIN_STYLES_DIR, createStyleRegistry } from '@litbase/citation/node'
import { DEFAULT_STYLE_ID } from '@litbase/citation'
import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { projects, userSettings } from '../db/schema'
import { env } from '../env'

export const styles = createStyleRegistry([env.STYLES_DIR ?? BUILTIN_STYLES_DIR, env.CUSTOM_STYLES_DIR])

export function styleExists(id: string) {
  return styles.getStyleXml(id) !== undefined
}

export async function getUserDefaultStyle(userId: string) {
  const [row] = await db.select().from(userSettings).where(eq(userSettings.userId, userId))
  const id = row?.citationStyle ?? DEFAULT_STYLE_ID
  return styleExists(id) ? id : DEFAULT_STYLE_ID
}

/**
 * Effektiver Stil: Projekt → Standard der Besitzerin bzw. des Besitzers (in geteilten Projekten
 * sehen so alle dasselbe) → ohne Projekt der eigene Standard → ieee-de.
 */
export async function resolveStyleId(userId: string, projectId?: string) {
  if (projectId) {
    const [project] = await db
      .select({ citationStyle: projects.citationStyle, ownerId: projects.userId })
      .from(projects)
      .where(eq(projects.id, projectId))
    if (project?.citationStyle && styleExists(project.citationStyle)) return project.citationStyle
    if (project) return getUserDefaultStyle(project.ownerId)
  }
  return getUserDefaultStyle(userId)
}
