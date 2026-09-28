import { describe, expect, it } from 'vitest'
import { checkQuestion, cleanTriadPart, composeTriad, triadSentence } from '../src'

const full = {
  topic: 'die Nutzung von KI-Tools im Bachelorstudium',
  knowledgeGoal: 'wie Studierende KI-Tools beim Schreiben einsetzen',
  relevance: 'zu verstehen, welche Unterstützung Hochschulen anbieten sollten',
}

describe('Forschungsdreisatz', () => {
  it('setzt den Satz zusammen', () => {
    expect(triadSentence(full)).toBe(
      'Ich untersuche die Nutzung von KI-Tools im Bachelorstudium, weil ich herausfinden möchte, wie Studierende KI-Tools beim Schreiben einsetzen, um zu verstehen, welche Unterstützung Hochschulen anbieten sollten.',
    )
  })

  it('entfernt mitgetippte Satzanfänge und Satzzeichen am Ende', () => {
    expect(cleanTriadPart('topic', 'Ich untersuche  Open Access.')).toBe('Open Access')
    expect(cleanTriadPart('knowledgeGoal', ', weil ich herausfinden will, ob X gilt')).toBe('ob X gilt')
    expect(cleanTriadPart('relevance', 'um zu zeigen, dass Y;')).toBe('zu zeigen, dass Y')
  })

  it('markiert fehlende Teile als Platzhalter', () => {
    const segments = composeTriad({ topic: 'Open Access' })
    expect(segments.filter((s) => s.missing).map((s) => s.part)).toEqual(['knowledgeGoal', 'relevance'])
    expect(triadSentence({ topic: 'Open Access' })).toBe('')
  })
})

describe('checkQuestion', () => {
  it('erkennt eine offene, vollständige Frage', () => {
    expect(checkQuestion('Wie setzen Studierende im Bachelorstudium KI-Tools beim Schreiben ein?')).toEqual({
      questionMark: true,
      open: true,
      length: true,
    })
  })

  it('erkennt Ja/Nein-Fragen, fehlendes Fragezeichen und zu kurze Fragen', () => {
    expect(checkQuestion('Ist KI im Studium sinnvoll?').open).toBe(false)
    expect(checkQuestion('Wie nutzen Studierende KI-Tools im Studium').questionMark).toBe(false)
    expect(checkQuestion('Warum KI?').length).toBe(false)
    expect(checkQuestion('')).toEqual({ questionMark: false, open: false, length: false })
  })
})
