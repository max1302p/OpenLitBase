/** Rücksprung nach dem Login (`/login?next=…`) – nur Pfade dieser App, keine fremden Adressen. */
export function nextPath(value: string | null) {
  return value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\') ? value : '/'
}
