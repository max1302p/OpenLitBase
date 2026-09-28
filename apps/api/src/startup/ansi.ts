/** Farben nur im Terminal (oder mit FORCE_COLOR); NO_COLOR schaltet sie immer ab. */
const enabled = !process.env.NO_COLOR && (Boolean(process.env.FORCE_COLOR) || process.stdout.isTTY === true)

const wrap = (code: string) => (text: string) => (enabled ? `\x1b[${code}m${text}\x1b[0m` : text)

export const color = {
  brand: wrap('38;5;68'), // Blau aus der Wortmarke, auf hellem und dunklem Grund lesbar
  grey: wrap('38;5;248'), // „Lit“-Grau
  dim: wrap('2'),
  bold: wrap('1'),
  green: wrap('32'),
  yellow: wrap('33'),
  red: wrap('31'),
  cyan: wrap('36'),
}

/** Sichtbare Länge ohne ANSI-Codes (für das Ausrichten im Kasten). */
export function visibleLength(text: string) {
  // eslint-disable-next-line no-control-regex
  return [...text.replace(/\x1b\[[\d;]*m/g, '')].length
}

export function padEnd(text: string, width: number) {
  return text + ' '.repeat(Math.max(0, width - visibleLength(text)))
}
