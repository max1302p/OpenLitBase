import { createAuthClient } from 'better-auth/client'

/** better-auth läuft in der API unter /api/auth (gleiche Origin bzw. Vite-Proxy). */
export const authClient = createAuthClient({ baseURL: window.location.origin, basePath: '/api/auth' })

/** Nach Klick auf den Bestätigungslink landet man hier (angemeldet oder mit ?error=…). */
export const VERIFY_CALLBACK = '/login'
export const RESET_REDIRECT = '/reset-password'
