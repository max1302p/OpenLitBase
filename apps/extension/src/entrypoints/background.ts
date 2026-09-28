import { ApiError, de, formatAuthors, getYear, itemTitle, type Item } from '@litbase/shared'
import { browser } from 'wxt/browser'
import { defineBackground } from 'wxt/utils/define-background'
import { getApi } from '../lib/api'
import type { AddResponse, BackgroundMessage } from '../lib/messages'
import { projectItem, recentItems } from '../lib/settings'

function errorText(error: unknown) {
  if (error instanceof ApiError) return error.status === 401 ? de.extension.unauthorized : error.message
  return de.extension.unreachable
}

async function remember(item: Item, projectId: string) {
  const recent = (await recentItems.getValue()).filter((r) => r.id !== item.id)
  const meta = [formatAuthors(item.csl, 2), getYear(item.csl)].filter(Boolean).join(' · ')
  await recentItems.setValue([{ id: item.id, projectId, title: itemTitle(item.csl), meta, addedAt: Date.now() }, ...recent].slice(0, 5))
}

/** Titel ins aktive Projekt übernehmen – per Angabe (DOI, ISBN, URL …) oder fertigen Katalogdaten. */
async function add(message: BackgroundMessage): Promise<AddResponse> {
  const projectId = await projectItem.getValue()
  if (!projectId) return { ok: false, error: de.extension.noProject }
  try {
    const api = await getApi()
    const { item, created } =
      message.type === 'add'
        ? await api.addByIdentifier({ input: message.input, projectId })
        : { item: await api.createItem({ csl: message.csl, projectId }), created: true }
    await remember(item, projectId)
    return { ok: true, title: itemTitle(item.csl), created }
  } catch (error) {
    return { ok: false, error: errorText(error) }
  }
}

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message: BackgroundMessage, _sender, sendResponse) => {
    void add(message).then(sendResponse)
    return true // Antwort kommt asynchron
  })
})
