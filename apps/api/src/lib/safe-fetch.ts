import { lookup } from 'node:dns/promises'
import { BlockList, isIP } from 'node:net'

const USER_AGENT = 'litbase/0.1 (Literaturverwaltung; +https://github.com/)'
const TIMEOUT_MS = 10_000
const MAX_REDIRECTS = 5

/** Private, lokale und Metadaten-Adressen – verhindert, dass der Server interne Dienste abruft (SSRF). */
const blocked = new BlockList()
for (const [net, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16],
  ['172.16.0.0', 12], ['192.168.0.0', 16], ['198.18.0.0', 15], ['224.0.0.0', 4],
] as const) {
  blocked.addSubnet(net, prefix, 'ipv4')
}
for (const [net, prefix] of [['::1', 128], ['fc00::', 7], ['fe80::', 10]] as const) {
  blocked.addSubnet(net, prefix, 'ipv6')
}

async function assertPublicHost(url: URL) {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('Nur http(s) erlaubt')
  const host = url.hostname.replace(/^\[|\]$/g, '')
  const addresses = isIP(host) ? [{ address: host, family: isIP(host) }] : await lookup(host, { all: true })
  for (const { address, family } of addresses) {
    // IPv4-gemappte IPv6-Adressen (::ffff:10.0.0.1) wie IPv4 prüfen.
    const mapped = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i)?.[1]
    const isBlocked = mapped
      ? blocked.check(mapped, 'ipv4')
      : blocked.check(address, family === 6 ? 'ipv6' : 'ipv4')
    if (isBlocked) {
      throw new Error(`Adresse nicht erlaubt: ${url.hostname}`)
    }
  }
}

/**
 * fetch für nutzergesteuerte URLs: nur öffentliche Hosts, Timeout, Redirects einzeln geprüft.
 * Für feste API-Endpunkte (Crossref, DNB …) reicht `apiFetch`.
 */
export async function safeFetch(input: string, init: RequestInit = {}): Promise<Response> {
  let url = new URL(input)
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicHost(url)
    const res = await apiFetch(url.toString(), { ...init, redirect: 'manual' })
    const location = res.headers.get('location')
    if (res.status >= 300 && res.status < 400 && location) {
      url = new URL(location, url)
      continue
    }
    return res
  }
  throw new Error('Zu viele Weiterleitungen')
}

export function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  if (!headers.has('User-Agent')) headers.set('User-Agent', USER_AGENT)
  return fetch(url, { ...init, headers, signal: AbortSignal.timeout(TIMEOUT_MS) })
}

/** JSON abrufen; bei HTTP-Fehlern oder ungültigem JSON undefined. */
export async function fetchJson<T>(url: string, init: RequestInit = {}): Promise<T | undefined> {
  try {
    const res = await apiFetch(url, init)
    if (!res.ok) return undefined
    return (await res.json()) as T
  } catch {
    return undefined
  }
}

export async function fetchText(url: string, init: RequestInit = {}): Promise<string | undefined> {
  try {
    const res = await apiFetch(url, init)
    return res.ok ? await res.text() : undefined
  } catch {
    return undefined
  }
}
