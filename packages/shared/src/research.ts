import type { ProjectResearch } from './schemas'

export type TriadPart = 'topic' | 'knowledgeGoal' | 'relevance'

/** Satzbausteine des Forschungsdreisatzes (nach Booth/Colomb/Williams, dt. u. a. Kruse). */
export const triadFrames: Record<TriadPart, string> = {
  topic: 'Ich untersuche',
  knowledgeGoal: 'weil ich herausfinden möchte,',
  relevance: 'um',
}

/** Doppelte Satzanfänge (falls jemand den Rahmen mittippt) und Schlusspunkte entfernen. */
export function cleanTriadPart(part: TriadPart, text: string | undefined) {
  let value = (text ?? '').trim().replace(/\s+/g, ' ')
  const prefixes: Record<TriadPart, RegExp> = {
    topic: /^ich\s+untersuche\s+/i,
    knowledgeGoal: /^,?\s*weil\s+ich\s+herausfinden\s+(möchte|will)\s*,?\s*/i,
    relevance: /^,?\s*um\s+/i,
  }
  value = value.replace(prefixes[part], '').replace(/[.,;:!?]+$/, '').trim()
  return value
}

export interface TriadSegment {
  text: string
  /** Gesetzt für die eingegebenen Teile (zum Hervorheben), leer für den Satzrahmen. */
  part?: TriadPart
  /** Teil fehlt noch – Platzhalter anzeigen. */
  missing?: boolean
}

/**
 * Den Dreisatz als Satz zusammensetzen: „Ich untersuche [Thema], weil ich herausfinden möchte,
 * [Erkenntnisinteresse], um [Relevanz].“ Fehlende Teile werden als Platzhalter markiert.
 */
export function composeTriad(research: ProjectResearch, placeholder = '…'): TriadSegment[] {
  const part = (key: TriadPart): TriadSegment => {
    const text = cleanTriadPart(key, research[key])
    return text ? { text, part: key } : { text: placeholder, part: key, missing: true }
  }
  return [
    { text: `${triadFrames.topic} ` },
    part('topic'),
    { text: `, ${triadFrames.knowledgeGoal} ` },
    part('knowledgeGoal'),
    { text: `, ${triadFrames.relevance} ` },
    part('relevance'),
    { text: '.' },
  ]
}

/** Der Dreisatz als ein Satz (leer, solange ein Teil fehlt). */
export function triadSentence(research: ProjectResearch) {
  const segments = composeTriad(research)
  return segments.some((s) => s.missing) ? '' : segments.map((s) => s.text).join('')
}

export type QuestionCheck = 'questionMark' | 'open' | 'length'

/**
 * Einfache Prüfungen für eine gute Forschungsfrage: endet mit „?“, ist offen formuliert (keine
 * Ja/Nein-Frage wie „Ist …?“) und hat eine sinnvolle Länge (6–40 Wörter).
 */
export function checkQuestion(question: string | undefined): Record<QuestionCheck, boolean> {
  const text = (question ?? '').trim()
  const words = text.split(/\s+/).filter(Boolean)
  const first = words[0]?.toLowerCase() ?? ''
  const closedStarts = /^(ist|sind|war|waren|gibt|hat|haben|kann|können|darf|dürfen|soll|sollen|wird|werden|muss|müssen|lässt|besteht|führt|beeinflusst|verbessert|hilft|macht)$/
  return {
    questionMark: text.endsWith('?'),
    open: words.length > 0 && !closedStarts.test(first),
    length: words.length >= 6 && words.length <= 40,
  }
}
