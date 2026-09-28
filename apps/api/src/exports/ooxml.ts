import { parseInlineHtml, splitEntry, type TextSegment } from './html-inline'

const HANGING_INDENT = 720 // 0,5 Zoll in Twips, wie im DOCX-Export

function escapeXml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function run(segment: TextSegment) {
  // Keine Rechtschreibprüfung: Namen und Titel sind oft fremdsprachig.
  const props = [
    '<w:noProof/>',
    segment.bold && '<w:b/>',
    segment.italics && '<w:i/>',
    segment.smallCaps && '<w:smallCaps/>',
    segment.superScript && '<w:vertAlign w:val="superscript"/>',
    segment.subScript && '<w:vertAlign w:val="subscript"/>',
  ].filter(Boolean)
  return `<w:r><w:rPr>${props.join('')}</w:rPr><w:t xml:space="preserve">${escapeXml(segment.text)}</w:t></w:r>`
}

const runs = (html: string) => parseInlineHtml(html).map(run).join('')

/** Verzeichniseintrag mit hängendem Einzug; numerische Stile mit Tabulator nach „[n]“. */
function entryParagraph(html: string) {
  const { label, body } = splitEntry(html)
  const tabs = label ? `<w:tabs><w:tab w:val="left" w:pos="${HANGING_INDENT}"/></w:tabs>` : ''
  const pPr = `<w:pPr>${tabs}<w:spacing w:after="120"/><w:ind w:left="${HANGING_INDENT}" w:hanging="${HANGING_INDENT}"/></w:pPr>`
  const content = label ? `${runs(label)}<w:r><w:rPr><w:noProof/></w:rPr><w:tab/></w:r>${runs(body)}` : runs(body)
  return `<w:p>${pPr}${content}</w:p>`
}

/**
 * Literaturverzeichnis als Flat-OPC-Paket für Office.js `insertOoxml`. Ohne Schriftangaben,
 * damit Word die Formatvorlage des Dokuments übernimmt.
 */
export function bibliographyOoxml(entries: string[]) {
  const body = entries.map(entryParagraph).join('')
  return (
    '<pkg:package xmlns:pkg="http://schemas.microsoft.com/office/2006/xmlPackage">' +
    '<pkg:part pkg:name="/_rels/.rels" pkg:contentType="application/vnd.openxmlformats-package.relationships+xml">' +
    '<pkg:xmlData><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
    '</Relationships></pkg:xmlData></pkg:part>' +
    '<pkg:part pkg:name="/word/document.xml" pkg:contentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml">' +
    '<pkg:xmlData><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    `<w:body>${body}</w:body></w:document></pkg:xmlData></pkg:part></pkg:package>`
  )
}
