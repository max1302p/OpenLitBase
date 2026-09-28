import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { readStyleInfo, type StyleInfo } from './style-info'
import type { LocaleLoader } from './types'

/** Mitgelieferte Styles und Locales dieses Pakets. */
export const BUILTIN_STYLES_DIR = path.resolve(import.meta.dirname, '../styles')

/**
 * Lädt CSL-Styles aus einem oder mehreren Ordnern (später genannte überschreiben frühere).
 * Neue Styles: `.csl`-Datei ablegen, der Dateiname ist die Style-ID. Locales liegen in `<ordner>/locales`.
 */
export function createStyleRegistry(dirs: string[]) {
  const existing = dirs.filter((dir) => existsSync(dir))

  function findFile(sub: string, name: string) {
    for (const dir of [...existing].reverse()) {
      const file = path.join(dir, sub, name)
      if (existsSync(file)) return file
    }
    return undefined
  }

  function listStyles(): StyleInfo[] {
    const ids = new Set(
      existing.flatMap((dir) =>
        readdirSync(dir)
          .filter((f) => f.endsWith('.csl'))
          .map((f) => f.slice(0, -4)),
      ),
    )
    return [...ids]
      .map((id) => ({ id, xml: getStyleXml(id)! }))
      // Abhängige Styles verweisen nur auf einen Parent und lassen sich allein nicht formatieren.
      .filter(({ xml }) => !xml.includes('rel="independent-parent"'))
      .map(({ id, xml }) => readStyleInfo(id, xml))
      .sort((a, b) => a.title.localeCompare(b.title, 'de'))
  }

  function getStyleXml(id: string): string | undefined {
    if (!/^[\w.-]+$/.test(id)) return undefined
    const file = findFile('', `${id}.csl`)
    return file ? readFileSync(file, 'utf8') : undefined
  }

  const localeCache = new Map<string, string | undefined>()
  const loadLocale: LocaleLoader = (lang) => {
    if (!localeCache.has(lang)) {
      const file = /^[\w-]+$/.test(lang) ? findFile('locales', `locales-${lang}.xml`) : undefined
      localeCache.set(lang, file ? readFileSync(file, 'utf8') : undefined)
    }
    return localeCache.get(lang)
  }

  return { listStyles, getStyleXml, loadLocale }
}

export type StyleRegistry = ReturnType<typeof createStyleRegistry>
