import { ApiError, de } from '@litbase/shared'

/** Fehlermeldung der API (deutsch) oder ein allgemeiner Hinweis. */
export function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : de.common.error
}
