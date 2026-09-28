import { zValidator } from '@hono/zod-validator'
import type { ValidationTargets } from 'hono'
import type { z } from 'zod'

/** zValidator mit einheitlicher Fehlerantwort `{ error }` (400). */
export function validate<T extends z.ZodType, Target extends keyof ValidationTargets>(
  target: Target,
  schema: T,
) {
  return zValidator(target, schema, (result, c) => {
    // Lesbarer Satz statt Zod-Baum, z. B. „Ungültige Domain“.
    if (!result.success) return c.json({ error: result.error.issues.map((i) => i.message).join(' · ') }, 400)
  })
}
