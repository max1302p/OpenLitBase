import type { Context } from 'hono'

/** Antwort als Datei-Download (Dateiname RFC-5987-kodiert, damit Umlaute funktionieren). */
export function download(c: Context, body: string | Uint8Array, filename: string, mime: string) {
  const ascii = filename.replace(/[^\x20-\x7e]/g, '_').replace(/"/g, '')
  c.header('Content-Type', mime)
  c.header(
    'Content-Disposition',
    `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
  )
  return c.body(typeof body === 'string' ? body : new Uint8Array(body))
}

/** Dateiname aus einem Projektnamen o. Ä. */
export function safeFilename(name: string) {
  return name.replace(/[\\/:*?"<>|]+/g, '_').trim() || 'litbase'
}
