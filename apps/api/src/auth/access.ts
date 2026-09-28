import { env } from '../env'
import { isEmailDomainAllowed } from './domains'

export function isAdminEmail(email: string) {
  return env.ADMIN_EMAILS.includes(email.toLowerCase())
}

/**
 * Darf dieses Konto die App nutzen? Im Modus "multi" nur mit E-Mail einer aktiven, freigegebenen
 * Domain. Admins sind ausgenommen, damit sie sich nicht versehentlich selbst aussperren.
 */
export async function hasAccess(email: string) {
  if (env.AUTH_MODE === 'single' || isAdminEmail(email)) return true
  return isEmailDomainAllowed(email)
}
