/// <reference path="./citeproc.d.ts" />
import CSL from 'citeproc'
import type { CslItem, EngineInput, LocaleLoader } from './types'

/** citeproc fragt Locales teils als `de` oder `de-DE` an; beides auflösen. */
function resolveLocale(loadLocale: LocaleLoader, lang: string) {
  const fallbacks: Record<string, string> = { de: 'de-DE', en: 'en-US', fr: 'fr-FR', it: 'it-IT' }
  return loadLocale(lang) ?? loadLocale(fallbacks[lang] ?? lang) ?? loadLocale('en-US')
}

/** Die Erstauflage nennt man nicht: „1“, „1.“, „1. Aufl.“, „1st ed.“ … entfallen. */
const FIRST_EDITION = /^\s*(1\.?|1st|first|erste)\s*(aufl(\.|age)?|ed(\.|ition)?)?\s*$/i

function withoutFirstEdition(item: CslItem): CslItem {
  if (!FIRST_EDITION.test(String(item.edition ?? ''))) return item
  const { edition: _, ...rest } = item
  return rest as CslItem
}

export function createEngine({ styleXml, loadLocale, items, format = 'html' }: EngineInput) {
  const byId = new Map(items.map((item) => [item.id, withoutFirstEdition(item)]))
  const engine = new CSL.Engine(
    {
      retrieveLocale: (lang) => resolveLocale(loadLocale, lang),
      retrieveItem: (id) => byId.get(id),
    },
    styleXml,
  )
  engine.setOutputFormat(format)
  return engine
}
