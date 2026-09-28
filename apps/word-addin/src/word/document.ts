import { de, type DocumentCitation, type FormattedDocument } from '@litbase/shared'
import { readCitations, storeCitation, type StoredCitation } from './document-settings'

/** Tags der Content Controls: `litbase:cite:<schlüssel>` pro Zitat, `litbase:bib` fürs Verzeichnis. */
const CITE_PREFIX = 'litbase:cite:'
const BIB_TAG = 'litbase:bib'

export type FormatDocument = (citations: DocumentCitation[]) => Promise<FormattedDocument>

export interface RefreshResult {
  citations: number
  entries: number
}

/** Zitat als Content Control an der Cursorposition einfügen; der Text kommt beim Aktualisieren. */
export async function insertCitation(citation: StoredCitation) {
  const key = crypto.randomUUID()
  await storeCitation(key, citation)
  await Word.run(async (context) => {
    const selection = context.document.getSelection()
    const paragraph = selection.paragraphs.getFirst()
    paragraph.load('text')
    await context.sync()
    const range = selection.insertText('[…]', Word.InsertLocation.end)
    // Füllt das Zitat einen leeren Absatz ganz aus, macht Word daraus ein Block-Steuerelement
    // (Cursor springt in die nächste Zeile). Ein Leerzeichen dahinter hält es im Fliesstext.
    if (paragraph.text === '') range.insertText(' ', Word.InsertLocation.after)
    const control = range.insertContentControl()
    control.tag = CITE_PREFIX + key
    control.title = de.appName
    // Cursor hinter das Zitat setzen, damit Weitertippen nicht im Zitat landet.
    control.getRange(Word.RangeLocation.after).select(Word.SelectionMode.end)
    await context.sync()
  })
}

/**
 * Literaturverzeichnis als eigenen Absatz an der Cursorposition einfügen.
 * Gibt `false` zurück, wenn es schon eines gibt (dann wird es markiert).
 */
export async function insertBibliography() {
  return Word.run(async (context) => {
    const existing = context.document.contentControls.getByTag(BIB_TAG)
    existing.load('items')
    const paragraph = context.document.getSelection().paragraphs.getFirst()
    paragraph.load('text')
    await context.sync()
    if (existing.items.length > 0) {
      existing.items[0]!.select()
      await context.sync()
      return false
    }
    const target = paragraph.text.trim() === '' ? paragraph : paragraph.insertParagraph('', Word.InsertLocation.after)
    const control = target.insertContentControl()
    control.tag = BIB_TAG
    control.title = `${de.appName} – ${de.bibliography.title}`
    await context.sync()
    return true
  })
}

/**
 * Word verschmilzt den letzten Absatz aus `insertOoxml` mit dem Zielabsatz und übernimmt dessen
 * Absatzformat. Deshalb den Zielabsatz vorher wie die Einträge in `apps/api/src/exports/ooxml.ts`
 * formatieren (hängender Einzug 0,5 Zoll = 36 pt, Abstand danach 6 pt). Nachher ginge nicht: Eine
 * Formatvorlage entfernt die Kursivschrift des Eintrags.
 */
function formatTarget(paragraph: Word.Paragraph) {
  paragraph.styleBuiltIn = 'Normal'
  paragraph.leftIndent = 36
  paragraph.firstLineIndent = -36
  paragraph.spaceAfter = 6
}

/** Alle Zitate in Dokumentreihenfolge neu formatieren (Nummern!) und das Verzeichnis neu setzen. */
export async function refreshDocument(format: FormatDocument): Promise<RefreshResult> {
  return Word.run(async (context) => {
    const controls = context.document.contentControls
    controls.load('items/tag,items/text')
    await context.sync()

    const cites = controls.items.filter((c) => c.tag?.startsWith(CITE_PREFIX))
    const bibs = controls.items.filter((c) => c.tag === BIB_TAG)
    const stored = readCitations()
    // Die ID ist die Position: auch kopierte Zitate (gleicher Tag) zählen einzeln.
    const citations = cites
      .map((control, i) => ({ id: String(i), items: stored[control.tag.slice(CITE_PREFIX.length)]?.items ?? [] }))
      .filter((citation) => citation.items.length > 0)

    const result = await format(citations)
    const texts = new Map(result.citations.map((c) => [c.id, c.text]))
    cites.forEach((control, i) => {
      const text = texts.get(String(i)) ?? de.addin.missingCitation
      if (control.text !== text) control.insertText(text, Word.InsertLocation.replace)
    })
    for (const bib of bibs) {
      if (result.bibliographyOoxml) {
        formatTarget(bib.paragraphs.getLast())
        bib.insertOoxml(result.bibliographyOoxml, Word.InsertLocation.replace)
      } else bib.insertText(de.addin.bibliographyEmpty, Word.InsertLocation.replace)
    }
    await context.sync()
    return { citations: cites.length, entries: result.bibliographyCount }
  })
}
