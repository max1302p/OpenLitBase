/** localStorage kann in Office-WebViews fehlen oder werfen – dann eben ohne Merken. */
function read(key: string) {
  try {
    return localStorage.getItem(key) ?? undefined
  } catch {
    return undefined
  }
}

function write(key: string, value: string | undefined) {
  try {
    if (value) localStorage.setItem(key, value)
    else localStorage.removeItem(key)
  } catch {
    // ignorieren
  }
}

const TOKEN_KEY = 'olb.addin.token'
const PROJECT_KEY = 'olb.addin.project'

export const readToken = () => read(TOKEN_KEY)
export const writeToken = (token: string | undefined) => write(TOKEN_KEY, token)
export const readLastProject = () => read(PROJECT_KEY)
export const writeLastProject = (id: string) => write(PROJECT_KEY, id)
