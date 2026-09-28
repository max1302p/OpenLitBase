import { readFileSync } from 'node:fs'
import path from 'node:path'

/** Version aus package.json im Arbeitsverzeichnis (apps/api im Dev, /app im Container). */
export function readVersion() {
  try {
    return (JSON.parse(readFileSync(path.resolve('package.json'), 'utf8')) as { version?: string }).version ?? '?'
  } catch {
    return '?'
  }
}
