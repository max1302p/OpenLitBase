import { de } from '@litbase/shared'
import { createMiddleware } from 'hono/factory'
import { isAdminEmail } from '../auth/access'
import { env } from '../env'
import type { AppEnv } from '../types'

/** Nur im Modus "multi" und nur für Adressen aus ADMIN_EMAILS (läuft nach requireUser). */
export const requireAdmin = createMiddleware<AppEnv>(async (c, next) => {
  if (env.AUTH_MODE !== 'multi' || !isAdminEmail(c.var.user.email)) {
    return c.json({ error: de.errors.adminOnly }, 403)
  }
  await next()
})
