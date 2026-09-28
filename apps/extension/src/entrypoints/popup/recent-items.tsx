import { de } from '@litbase/shared'
import { browser } from 'wxt/browser'
import { recentItems } from '../../lib/settings'
import { useStorageItem } from './use-storage-item'

/** Zuletzt übernommene Titel; Klick öffnet den Titel in OpenLitBase. */
export function RecentItems({ serverUrl }: { serverUrl: string }) {
  const items = useStorageItem(recentItems) ?? []
  return (
    <section className="space-y-1.5">
      <h2 className="text-xs font-medium text-muted-foreground">{de.extension.recentTitle}</h2>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">{de.extension.recentEmpty}</p>
      ) : (
        <ul className="-mx-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="w-full rounded-md px-2 py-1.5 text-left hover:bg-muted"
                onClick={() => void browser.tabs.create({ url: `${serverUrl}/projects/${item.projectId}/items/${item.id}` })}
              >
                <span className="block truncate text-sm">{item.title}</span>
                {item.meta && <span className="block truncate text-xs text-muted-foreground">{item.meta}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
