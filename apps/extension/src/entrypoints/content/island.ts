import { de } from '@litbase/shared/de'
// Bildmarke „O“ wie das Extension-Symbol, eingebettet (keine freigegebenen Extension-Pfade nötig).
import mark from '@litbase/ui/assets/mark.png?inline'
import type { AddResponse } from '../../lib/messages'

type State = 'idle' | 'loading' | 'done' | 'error'

const ICONS: Record<State, string> = {
  idle: '',
  loading: '<path d="M21 12a9 9 0 1 1-6.2-8.6"/>',
  done: '<path d="M20 6 9 17l-5-5"/>',
  error: '<path d="M12 8v5M12 16.5v.5"/>',
}

const STYLE = `
  :host { all: initial; }
  .fab { position: fixed; left: 20px; bottom: 20px; z-index: 2147483647; display: flex; align-items: center;
    height: 48px; border-radius: 999px; background: #0B2351; color: #fff;
    font: 13px/1.3 system-ui, -apple-system, 'Segoe UI', sans-serif; box-shadow: 0 8px 28px rgba(11,35,81,.35);
    animation: in .3s cubic-bezier(.2,.9,.3,1.2); transition: background .2s; }
  .fab.hide { animation: out .2s ease-in forwards; }
  .fab[data-state=done] { background: #067647; }
  .fab[data-state=error] { background: #b42318; }
  /* Pulsierender Ring, solange die Leiste zu ist */
  .fab::before { content: ''; position: absolute; left: 0; top: 0; width: 48px; height: 48px; border-radius: 999px;
    background: inherit; z-index: -1; animation: pulse 2s ease-out infinite; }
  .fab:hover::before, .fab:focus-within::before, .fab.open::before, .fab:not([data-state=idle])::before { animation: none; opacity: 0; }
  .icon { all: unset; cursor: pointer; flex: none; display: grid; place-items: center; width: 48px; height: 48px; border-radius: 999px; }
  .icon:focus-visible { outline: 2px solid #fff; outline-offset: -4px; }
  svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .fab[data-state=loading] .icon svg { animation: spin .8s linear infinite; }
  .mark { width: 24px; height: 24px; filter: brightness(0) invert(1); }
  .fab:not([data-state=idle]) .mark, .fab[data-state=idle] .icon svg { display: none; }
  .panel { display: flex; align-items: center; gap: 10px; max-width: 0; opacity: 0; overflow: hidden;
    transition: max-width .3s ease, opacity .2s ease, padding .3s ease; }
  .fab:hover .panel, .fab:focus-within .panel, .fab.open .panel, .fab:not([data-state=idle]) .panel {
    max-width: min(460px, calc(100vw - 100px)); opacity: 1; padding-right: 6px; }
  .text { display: grid; min-width: 0; }
  .label { font-size: 11px; opacity: .75; white-space: nowrap; }
  .title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600; max-width: 280px; }
  button { all: unset; cursor: pointer; flex: none; border-radius: 999px; font-weight: 600; }
  .add { padding: 8px 14px; background: #fff; color: #0B2351; white-space: nowrap; }
  .add:hover { background: #e8ecf5; }
  .add:focus-visible, .close:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
  .fab[data-state=loading] .add, .fab[data-state=done] .add { display: none; }
  .close { display: grid; place-items: center; width: 28px; height: 28px; opacity: .7; }
  .close svg { width: 16px; height: 16px; }
  .close:hover { opacity: 1; background: rgba(255,255,255,.15); }
  @keyframes pulse { 0% { transform: scale(1); opacity: .55; } 100% { transform: scale(1.8); opacity: 0; } }
  @keyframes in { from { opacity: 0; transform: translateY(16px) scale(.8); } }
  @keyframes out { to { opacity: 0; transform: translateY(16px) scale(.8); } }
  @keyframes spin { to { transform: rotate(360deg); } }
`

/**
 * Pulsierendes Übernehmen-Symbol unten links, wenn die Seite ein einzelner Titel ist. Beim Überfahren (oder
 * Antippen/Fokus) klappt es auf: „Titel erkannt“, Titel, „Übernehmen“. Nach dem Übernehmen
 * verschwindet es von selbst.
 */
/** Was das Symbol anzeigt und wie übernommen wird (Angabe oder fertige Katalogdaten). */
export interface IslandWork {
  title: string
  add: () => Promise<AddResponse>
}

export function createIsland() {
  let host: HTMLElement | undefined

  function hide() {
    const island = host?.shadowRoot?.querySelector('.fab')
    if (!island) return
    island.classList.add('hide')
    const old = host
    host = undefined
    setTimeout(() => old?.remove(), 200)
  }

  function show(work: IslandWork) {
    hide()
    host = document.createElement('olb-island')
    const shadow = host.attachShadow({ mode: 'open' })
    shadow.innerHTML = `<style>${STYLE}</style>
      <div class="fab" role="status" data-state="idle">
        <button class="icon" type="button" aria-expanded="false"><img class="mark" alt=""><svg viewBox="0 0 24 24"></svg></button>
        <div class="panel">
          <div class="text"><span class="label"></span><span class="title"></span></div>
          <button class="add" type="button"></button>
          <button class="close" type="button"><svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
        </div>
      </div>`
    const island = shadow.querySelector<HTMLElement>('.fab')!
    const toggle = shadow.querySelector<HTMLButtonElement>('.icon')!
    const icon = toggle.querySelector('svg')!
    toggle.querySelector<HTMLImageElement>('.mark')!.src = mark
    const label = shadow.querySelector('.label')!
    const title = shadow.querySelector('.title')!
    const button = shadow.querySelector<HTMLButtonElement>('.add')!
    const close = shadow.querySelector<HTMLButtonElement>('.close')!
    close.setAttribute('aria-label', de.extension.island.close)
    toggle.setAttribute('aria-label', de.extension.island.label)
    // Touch-Geräte kennen kein Überfahren: Antippen klappt auf bzw. zu.
    toggle.addEventListener('click', () => {
      const open = island.classList.toggle('open')
      toggle.setAttribute('aria-expanded', String(open))
    })
    title.textContent = work.title

    const setState = (state: State, text: string) => {
      island.dataset.state = state
      icon.innerHTML = ICONS[state]
      label.textContent = text
    }
    setState('idle', de.extension.island.label)
    button.textContent = de.extension.island.add

    button.addEventListener('click', async () => {
      setState('loading', de.extension.island.adding)
      const result = await work.add().catch((): AddResponse => ({ ok: false, error: de.extension.unreachable }))
      if (result.ok) {
        setState('done', de.extension.island.done)
        title.textContent = result.title
        setTimeout(hide, 2500)
      } else {
        setState('error', result.error)
        button.textContent = de.extension.island.retry
      }
    })
    close.addEventListener('click', hide)
    document.documentElement.append(host)
  }

  return { show, hide }
}
