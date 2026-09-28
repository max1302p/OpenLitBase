import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TabStopType, TextRun } from 'docx'
import { parseInlineHtml, splitEntry } from './html-inline'

const HANGING_INDENT = 720 // 0,5 Zoll in Twips

function runs(html: string) {
  return parseInlineHtml(html).map((segment) => new TextRun(segment))
}

/** Ein Verzeichniseintrag mit hängendem Einzug; numerische Stile mit Tabulator nach „[n]“. */
export function entryParagraph(html: string) {
  const { label, body } = splitEntry(html)
  return new Paragraph({
    spacing: { after: 120 },
    indent: { left: HANGING_INDENT, hanging: HANGING_INDENT },
    tabStops: label ? [{ type: TabStopType.LEFT, position: HANGING_INDENT }] : [],
    children: label ? [...runs(label), new TextRun('\t'), ...runs(body)] : runs(body),
  })
}

export function bibliographyDocx(title: string, entries: string[]): Promise<Buffer> {
  const doc = new Document({
    styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
    sections: [
      {
        children: [
          new Paragraph({ text: title, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.LEFT }),
          ...entries.map(entryParagraph),
        ],
      },
    ],
  })
  return Packer.toBuffer(doc)
}

export const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
