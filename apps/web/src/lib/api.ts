import { createApiClient } from '@litbase/shared'

/** Die Web-App läuft auf derselben Origin wie die API (im Dev über den Vite-Proxy). */
export const api = createApiClient({ baseUrl: '' })
