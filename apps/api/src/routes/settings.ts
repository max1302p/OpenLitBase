import { de, settingsSchema, type Settings } from '@litbase/shared'
import { Hono } from 'hono'
import { getUserDefaultStyle, styleExists } from '../citation/styles'
import { db } from '../db/client'
import { userSettings } from '../db/schema'
import { validate } from '../lib/validate'
import type { AppEnv } from '../types'

export const settingsRoutes = new Hono<AppEnv>()
  .get('/', async (c) => {
    return c.json({ citationStyle: await getUserDefaultStyle(c.var.user.id) } satisfies Settings)
  })
  .put('/', validate('json', settingsSchema), async (c) => {
    const input = c.req.valid('json')
    if (!styleExists(input.citationStyle)) return c.json({ error: de.errors.unknownStyle }, 400)
    await db
      .insert(userSettings)
      .values({ userId: c.var.user.id, ...input })
      .onConflictDoUpdate({ target: userSettings.userId, set: input })
    return c.json(input satisfies Settings)
  })
