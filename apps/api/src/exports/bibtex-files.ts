/**
 * Anhänge aus BibTeX-Feldern `file` (Citavi, JabRef): `{Beschreibung:Attachments/x.pdf:application/pdf}`,
 * mehrere durch `;` getrennt. citation-js verwirft das Feld, deshalb hier direkt aus dem Text.
 * Ergebnis: Zitierschlüssel → relative Pfade.
 */
export function bibtexFiles(content: string): Map<string, string[]> {
  const files = new Map<string, string[]>()
  for (const entry of content.split(/^\s*@/m).slice(1)) {
    const key = entry.match(/^\w+\s*[{(]\s*([^,\s]+)\s*,/)?.[1]
    const field = entry.match(/\bfile\s*=\s*[{"](.*?)[}"]\s*,?\s*$/im)?.[1]
    if (!key || !field) continue
    const paths = field
      .split(';')
      .map((part) => {
        const pieces = part.split(':')
        // „Beschreibung:Pfad:Typ“; Windows-Laufwerke („C:\…“) enthalten selbst einen Doppelpunkt.
        return (pieces.length >= 3 ? pieces.slice(1, -1).join(':') : part).trim()
      })
      .filter(Boolean)
    if (paths.length > 0) files.set(key, paths)
  }
  return files
}
