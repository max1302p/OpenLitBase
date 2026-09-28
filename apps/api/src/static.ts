import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { serveStatic } from '@hono/node-server/serve-static'
import type { Hono } from 'hono'
import { env } from './env'

/**
 * Liefert die gebauten Frontends aus: `/addin/*` → public/addin, alles andere → public/web.
 * Unbekannte Pfade fallen auf die jeweilige index.html zurück (SPA-Routing).
 */
export function mountStatic(app: Hono<any>) {
  const publicDir = path.resolve(env.PUBLIC_DIR)
  const mounts = [
    { prefix: '/addin', dir: path.join(publicDir, 'addin') },
    { prefix: '', dir: path.join(publicDir, 'web') },
  ]

  for (const { prefix, dir } of mounts) {
    const indexFile = path.join(dir, 'index.html')
    if (!existsSync(indexFile)) continue
    const indexHtml = readFileSync(indexFile, 'utf8')
    const root = path.relative(process.cwd(), dir)

    app.use(
      `${prefix}/*`,
      serveStatic({ root, rewriteRequestPath: (p) => p.slice(prefix.length) || '/' }),
    )
    app.get(`${prefix}/*`, (c) => c.html(indexHtml))
  }
}
