import { ApiError, createApiClient } from '@litbase/shared'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { readToken, writeToken } from '../lib/storage'

/**
 * Das Add-in läuft auf derselben Origin wie die API. Modus `single` braucht nichts, im Modus
 * `multi` genügt eine Sitzung oder – in Word üblich – ein persönlicher API-Token.
 */
export function useConnection() {
  const [token, setToken] = useState(readToken)
  const api = useMemo(() => createApiClient({ baseUrl: '', token }), [token])
  const me = useQuery({ queryKey: ['me', token ?? ''], queryFn: api.getMe })
  const config = useQuery({ queryKey: ['config'], queryFn: api.getConfig })
  const unauthorized = me.error instanceof ApiError && me.error.status === 401

  function connect(next: string | undefined) {
    writeToken(next)
    setToken(next)
  }

  return { api, token, me, isMulti: config.data?.authMode === 'multi', unauthorized, connect }
}
