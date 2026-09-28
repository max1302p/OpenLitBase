import { useEffect, useState } from 'react'
import type { WxtStorageItem } from 'wxt/utils/storage'

/** Wert aus `browser.storage` lesen und bei Änderungen (auch aus dem Hintergrund) aktualisieren. */
export function useStorageItem<T>(item: WxtStorageItem<T, Record<string, unknown>>) {
  const [value, setValue] = useState<T>()
  useEffect(() => {
    void item.getValue().then(setValue)
    return item.watch((next) => setValue(next))
  }, [item])
  return value
}
