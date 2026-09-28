/** Kleiner Hinweis unten rechts, im Shadow DOM, damit das Seiten-CSS nicht stört. */
let container: HTMLElement | undefined

function getContainer() {
  if (container?.isConnected) return container
  const host = document.createElement('olb-toasts')
  host.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483647'
  const shadow = host.attachShadow({ mode: 'closed' })
  shadow.innerHTML = `<style>
    div { display:flex; flex-direction:column; gap:8px; align-items:flex-end; }
    p { all:initial; display:block; max-width:340px; padding:10px 14px; border-radius:10px;
      font:500 13px/1.4 system-ui,-apple-system,sans-serif; color:#fff; background:#0B2351;
      box-shadow:0 4px 16px rgba(0,0,0,.25); animation:in .15s ease-out; }
    p.error { background:#b42318; }
    @keyframes in { from { opacity:0; transform:translateY(6px); } }
  </style><div></div>`
  document.documentElement.append(host)
  container = shadow.querySelector('div')!
  return container
}

export function showToast(text: string, kind: 'success' | 'error' = 'success') {
  const p = document.createElement('p')
  p.textContent = text
  if (kind === 'error') p.className = 'error'
  getContainer().append(p)
  setTimeout(() => p.remove(), kind === 'error' ? 6000 : 4000)
}
