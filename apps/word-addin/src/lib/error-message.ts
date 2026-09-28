import { ApiError, de } from '@litbase/shared'

/** Meldung der API (deutsch), sonst Word- bzw. allgemeiner Fehler. */
export function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  if (typeof OfficeExtension !== 'undefined' && error instanceof OfficeExtension.Error) {
    return `${de.addin.wordError} (${error.message})`
  }
  return de.common.error
}
