/** Wird in main.tsx gesetzt, sobald Office.js bereit ist. */
let wordHost = false

export function setWordHost(value: boolean) {
  wordHost = value
}

/** Läuft das Add-in in Word (und nicht nur als Vorschau im Browser)? */
export function isWord() {
  return wordHost
}

/** Link im Standardbrowser öffnen (Taskpanes navigieren sonst im eigenen Fenster). */
export function openInBrowser(path: string) {
  const url = new URL(path, window.location.origin).href
  if (wordHost && Office.context.requirements.isSetSupported('OpenBrowserWindowApi', '1.1')) {
    Office.context.ui.openBrowserWindow(url)
  } else {
    window.open(url, '_blank', 'noopener')
  }
}
