import { de, type Config } from '@litbase/shared'
import { Hono } from 'hono'
import { env } from '../env'

export const publicRoutes = new Hono()
  .get('/health', (c) => c.json({ status: 'ok' }))
  .get('/config', (c) =>
    c.json({
      authMode: env.AUTH_MODE,
      appName: de.appName,
      legal: {
        imprintUrl: env.LEGAL_IMPRINT_URL ?? null,
        privacyUrl: env.LEGAL_PRIVACY_URL ?? null,
        termsUrl: env.LEGAL_TERMS_URL ?? null,
      },
      avatarUrl: env.AVATAR_URL,
      sourceUrl: env.SOURCE_URL,
    } satisfies Config),
  )
