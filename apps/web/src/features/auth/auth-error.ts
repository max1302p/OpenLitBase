import { de } from '@litbase/shared'

interface AuthError {
  code?: string
  message?: string
}

/** better-auth-Fehler in deutsche Meldungen übersetzen (eigene Meldungen der API bleiben). */
export function authErrorMessage(error: AuthError | null | undefined) {
  switch (error?.code?.toUpperCase()) {
    case 'INVALID_EMAIL_OR_PASSWORD':
      return de.auth.invalidCredentials
    case 'EMAIL_NOT_VERIFIED':
      return de.auth.notVerified
    case 'INVALID_TOKEN':
    case 'TOKEN_EXPIRED':
      return de.auth.linkInvalid
    case 'PASSWORD_TOO_SHORT':
      return de.auth.passwordHint
    case 'INVALID_PASSWORD':
      return de.settings.wrongPassword
    case 'DOMAIN_NOT_ALLOWED':
      return error.message ?? de.common.error
    default:
      return error?.message ?? de.common.error
  }
}
