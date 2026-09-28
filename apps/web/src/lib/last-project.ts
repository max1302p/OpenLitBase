const KEY = 'olb:last-project'

/** Zuletzt geöffnetes Projekt (nur Komfort – Zugriff kann im privaten Modus fehlschlagen). */
export function getLastProjectId() {
  try {
    return localStorage.getItem(KEY) ?? undefined
  } catch {
    return undefined
  }
}

export function setLastProjectId(id: string | undefined) {
  try {
    if (id) localStorage.setItem(KEY, id)
    else localStorage.removeItem(KEY)
  } catch {
    // ignorieren
  }
}
