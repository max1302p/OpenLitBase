import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  PageOrientation,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'

/** Tabellen für Exporte (Rechercheprotokoll, Begriffsmatrix) als Markdown und DOCX. */
export interface TableExport {
  title: string
  headers: string[]
  rows: string[][]
  /** Absätze unter der Tabelle, z. B. der Suchstring. */
  after?: { label: string; text: string }[]
}

function markdownCell(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>') || ' '
}

export function markdownTable(headers: string[], rows: string[][]) {
  const line = (cells: string[]) => `| ${cells.map(markdownCell).join(' | ')} |`
  return [line(headers), `| ${headers.map(() => '---').join(' | ')} |`, ...rows.map(line)].join('\n')
}

export function tableMarkdown({ title, headers, rows, after = [] }: TableExport) {
  const table = markdownTable(headers, rows)
  const extra = after.map(({ label, text }) => `**${label}:**\n\n\`\`\`\n${text}\n\`\`\``).join('\n\n')
  return `# ${title}\n\n${table}\n${extra ? `\n${extra}\n` : ''}`
}

function cellParagraphs(text: string, bold = false) {
  const lines = text ? text.split('\n') : ['']
  return lines.map((line) => new Paragraph({ children: [new TextRun({ text: line, bold, size: 18 })] }))
}

/** Tabelle mit grau hinterlegter, sich wiederholender Kopfzeile. */
export function docxTable(headers: string[], rows: string[][]) {
  const header = new TableRow({
    tableHeader: true,
    children: headers.map(
      (text) =>
        new TableCell({
          children: cellParagraphs(text, true),
          shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'E7EAF0' },
        }),
    ),
  })
  const body = rows.map((cells) => new TableRow({ children: cells.map((text) => new TableCell({ children: cellParagraphs(text) })) }))
  return new Table({ rows: [header, ...body], width: { size: 100, type: WidthType.PERCENTAGE } })
}

/** Querformat-Dokument mit Überschrift und Tabelle. */
export function tableDocx({ title, headers, rows, after = [] }: TableExport): Promise<Buffer> {
  const table = docxTable(headers, rows)
  const extra = after.flatMap(({ label, text }) => [
    new Paragraph({ spacing: { before: 300 }, children: [new TextRun({ text: label, bold: true })] }),
    new Paragraph({ children: [new TextRun({ text, font: 'Consolas', size: 20 })] }),
  ])

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
    sections: [
      {
        properties: { page: { size: { orientation: PageOrientation.LANDSCAPE } } },
        children: [
          new Paragraph({ text: title, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.LEFT }),
          table,
          ...extra,
        ],
      },
    ],
  })
  return Packer.toBuffer(doc)
}
