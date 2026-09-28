import { XMLParser } from 'fast-xml-parser'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@',
  removeNSPrefix: true,
  textNodeName: '#text',
  parseTagValue: false,
  isArray: (name) => ['record', 'datafield', 'subfield', 'entry', 'author', 'link'].includes(name),
})

export function parseXml(xml: string): unknown {
  return parser.parse(xml)
}

/** Sucht rekursiv alle Objekte, die einen bestimmten Schlüssel enthalten (z. B. MARC-Records). */
export function findAll(node: unknown, key: string, out: Record<string, unknown>[] = []) {
  if (Array.isArray(node)) {
    node.forEach((child) => findAll(child, key, out))
  } else if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    if (key in obj) out.push(obj)
    Object.values(obj).forEach((child) => findAll(child, key, out))
  }
  return out
}

/** Textinhalt eines Knotens (String oder `{ '#text': … }`). */
export function text(node: unknown): string | undefined {
  if (typeof node === 'string') return node
  if (node && typeof node === 'object' && '#text' in node) return String(node['#text'])
  return undefined
}
