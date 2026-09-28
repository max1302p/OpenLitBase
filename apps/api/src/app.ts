import { getConnInfo } from '@hono/node-server/conninfo'
import { Hono, type Context, type MiddlewareHandler } from 'hono'
import { logger } from 'hono/logger'
import { renderManifest } from './addin/manifest'
import { getAuth } from './auth/better-auth'
import { env } from './env'
import { handleMcpRequest } from './mcp/server'
import { requireUser } from './middleware/auth'
import { requireAdmin } from './middleware/admin'
import { extensionCors } from './middleware/cors'
import { adminDomainRoutes } from './routes/admin-domains'
import { adminUserRoutes } from './routes/admin-users'
import { attachmentRoutes } from './routes/attachments'
import { importExportRoutes } from './routes/import-export'
import { institutionRoutes } from './routes/institutions'
import { itemRoutes } from './routes/items'
import { meRoutes } from './routes/me'
import { projectMemberRoutes } from './routes/project-members'
import { projectResearchRoutes } from './routes/project-research'
import { projectRoutes } from './routes/projects'
import { publicRoutes } from './routes/public'
import { settingsRoutes } from './routes/settings'
import { styleRoutes } from './routes/styles'
import { tokenRoutes } from './routes/tokens'
import { mountStatic } from './static'
import type { AppEnv } from './types'

/** Ohne Reverse-Proxy fehlt X-Forwarded-For – dann die IP der TCP-Verbindung eintragen. */
function withClientIp(request: Request, c: Context) {
  if (request.headers.has('x-forwarded-for')) return request
  const address = getConnInfo(c).remote.address
  if (!address) return request
  const headers = new Headers(request.headers)
  headers.set('x-forwarded-for', address)
  return new Request(request, { headers, duplex: 'half' } as RequestInit)
}

/** Pfad, unter dem die lokale CA zum Vertrauen bereitliegt (auch über http). */
export const CA_PATH = '/openlitbase-ca.crt'

/**
 * Wer im Browser http:// eintippt, landet auf https:// (gleicher Host und Port). API-Aufrufe
 * bleiben auf http möglich – die Browser-Extension ist oft mit `http://localhost:1450` eingerichtet.
 */
const upgradeNavigation: MiddlewareHandler<AppEnv> = async (c, next) => {
  const url = new URL(c.req.url)
  const isNavigation =
    (c.req.method === 'GET' || c.req.method === 'HEAD') && c.req.header('accept')?.includes('text/html')
  if (url.protocol !== 'http:' || !isNavigation || url.pathname.startsWith('/api/') || url.pathname === CA_PATH) {
    return next()
  }
  url.protocol = 'https:'
  return c.redirect(url.toString(), 308)
}

/** `caPem`: HTTPS läuft im Container mit eigener CA (siehe tls/local-certificate.ts). */
export function createApp(options: { caPem?: string } = {}) {
  const app = new Hono<AppEnv>()
  if (options.caPem) {
    const caPem = options.caPem
    app.use('*', upgradeNavigation)
    app.get(CA_PATH, (c) =>
      c.body(caPem, 200, {
        'Content-Type': 'application/x-x509-ca-cert',
        'Content-Disposition': 'attachment; filename="openlitbase-ca.crt"',
      }),
    )
  }
  app.use('/api/*', logger())
  app.use('/api/*', extensionCors)
  app.onError((err, c) => {
    console.error(err)
    return c.json({ error: 'Interner Serverfehler' }, 500)
  })

  app.route('/api', publicRoutes)
  app.route('/api/institutions', institutionRoutes)
  if (env.AUTH_MODE === 'multi') {
    app.on(['GET', 'POST'], '/api/auth/*', (c) => getAuth().handler(withClientIp(c.req.raw, c)))
  }

  app.use('/api/*', requireUser)
  app.route('/api/me', meRoutes)
  app.route('/api/projects', projectRoutes)
  app.route('/api/projects/:id', projectResearchRoutes)
  app.route('/api/projects/:id/members', projectMemberRoutes)
  app.route('/api/items', itemRoutes)
  app.route('/api/attachments', attachmentRoutes)
  app.route('/api/styles', styleRoutes)
  app.route('/api/settings', settingsRoutes)
  app.route('/api/tokens', tokenRoutes)
  app.route('/api', importExportRoutes)
  // KI-Agenten (Model Context Protocol), angemeldet wie Extension und Add-in.
  app.all('/api/mcp', (c) => handleMcpRequest(c.req.raw, c.var.user))
  app.use('/api/admin/*', requireAdmin)
  app.route('/api/admin/domains', adminDomainRoutes)
  app.route('/api/admin/users', adminUserRoutes)
  app.all('/api/*', (c) => c.json({ error: 'Nicht gefunden' }, 404))

  // Öffentlich, damit Word das Manifest ohne Login laden kann.
  app.get('/addin/manifest.xml', (c) =>
    c.body(renderManifest(), 200, {
      'Content-Type': 'application/xml; charset=utf-8',
      'Content-Disposition': 'attachment; filename="openlitbase-manifest.xml"',
    }),
  )
  mountStatic(app)
  return app
}
