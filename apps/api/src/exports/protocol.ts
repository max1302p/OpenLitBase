import {
  composeTriad,
  de,
  termMatrixRowKeys,
  type ItemProtocol,
  type ProjectResearch,
  type TermMatrixData,
} from '@litbase/shared'
import { AlignmentType, Document, HeadingLevel, Packer, PageOrientation, Paragraph, TextRun } from 'docx'
import { entryParagraph } from './docx'
import { entryToMarkdown } from './html-inline'
import { docxTable, markdownTable } from './tables'

/** Alles, was das Rechercheprotokoll braucht – Aufbau wie die gängige Vorlage. */
export interface ProtocolDocument {
  projectName: string
  research: ProjectResearch
  matrix: TermMatrixData
  titles: { number: number; type: string; protocol: ItemProtocol }[]
  /** Literaturverzeichnis (HTML), gleiche Reihenfolge wie `titles`. */
  bibliography: string[]
}

const t = de.protocol

function triadText(research: ProjectResearch) {
  return composeTriad(research).map((segment) => segment.text).join('')
}

/** Begriffsmatrix wie in der Vorlage: eine Zeile pro Teilthema, Spalten = Kategorien. */
function matrixTable(matrix: TermMatrixData) {
  const headers = [t.matrixColumns.term, ...termMatrixRowKeys.map((row) => t.matrixColumns[row])]
  const rows = matrix.columns.map((column) => [
    column.title,
    // Begriffe wie in der Vorlage schlicht auflisten (Anführungszeichen gehören nur in den Suchstring).
    ...termMatrixRowKeys.map((row) => (column.cells[row] ?? []).map((term) => term.text + (term.truncate ? '*' : '')).join(', ')),
  ])
  return { headers, rows }
}

function titlesTable(titles: ProtocolDocument['titles']) {
  const c = t.columns
  return {
    headers: [c.number, c.citation, c.type, c.keywords, c.suitability],
    rows: titles.map(({ number, type, protocol }) => [
      `[${number}]`,
      protocol.citation ?? '',
      de.itemTypes[type] ?? type,
      protocol.keywords ?? '',
      protocol.suitability ?? '',
    ]),
  }
}

export function protocolMarkdown(doc: ProtocolDocument) {
  const matrix = matrixTable(doc.matrix)
  const titles = titlesTable(doc.titles)
  return [
    `# ${t.title}: ${doc.projectName}`,
    `## ${t.triad}`,
    triadText(doc.research),
    ...(doc.research.question ? [`**${t.question}:** ${doc.research.question}`] : []),
    `## ${t.matrix}`,
    matrix.rows.length > 0 ? markdownTable(matrix.headers, matrix.rows) : t.matrixEmpty,
    `## ${t.titles}`,
    markdownTable(titles.headers, titles.rows),
    `## ${t.bibliography}`,
    doc.bibliography.map(entryToMarkdown).join('\n\n'),
  ].join('\n\n') + '\n'
}

export function protocolDocx(doc: ProtocolDocument): Promise<Buffer> {
  const heading = (text: string) => new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 360, after: 120 } })
  const matrix = matrixTable(doc.matrix)
  const titles = titlesTable(doc.titles)
  const document = new Document({
    styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
    sections: [
      {
        properties: { page: { size: { orientation: PageOrientation.LANDSCAPE } } },
        children: [
          new Paragraph({ text: `${t.title}: ${doc.projectName}`, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.LEFT }),
          heading(t.triad),
          new Paragraph({ text: triadText(doc.research) }),
          ...(doc.research.question
            ? [new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: `${t.question}: `, bold: true }), new TextRun(doc.research.question)] })]
            : []),
          heading(t.matrix),
          matrix.rows.length > 0 ? docxTable(matrix.headers, matrix.rows) : new Paragraph(t.matrixEmpty),
          heading(t.titles),
          docxTable(titles.headers, titles.rows),
          heading(t.bibliography),
          ...doc.bibliography.map(entryParagraph),
        ],
      },
    ],
  })
  return Packer.toBuffer(document)
}
