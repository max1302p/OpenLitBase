import { execFileSync } from 'node:child_process'
import { randomBytes, X509Certificate } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { isIP } from 'node:net'
import path from 'node:path'
import { env } from '../env'

export interface TlsSetup {
  key: Buffer
  cert: Buffer
  /** PEM der lokalen CA – einmal vertrauen, danach akzeptieren Word und Browser das Zertifikat. */
  caPem: string
  validTo: Date
  /** CA wurde bei diesem Start neu erzeugt (muss erneut vertraut werden). */
  caCreated: boolean
}

const CA_DAYS = 3650
/** Apple akzeptiert Serverzertifikate höchstens 825 Tage, Browser rechnen mit ≤ 398. */
const SERVER_DAYS = 397
const RENEW_BEFORE_MS = 30 * 24 * 60 * 60 * 1000

const LOOPBACK_NAMES = ['localhost']
const LOOPBACK_IPS = ['127.0.0.1', '::1']

/** Adressen, die nur dieser Rechner bzw. das lokale Netz erreicht – dafür braucht es eine eigene CA. */
function isLocalHost(host: string) {
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return true
  if (isIP(host) === 6) return true
  return /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)
}

function baseUrlHost() {
  return new URL(env.BASE_URL).hostname.replace(/^\[|\]$/g, '')
}

/** HTTPS direkt im Container: automatisch bei lokaler https-BASE_URL, sonst übernimmt ein Reverse-Proxy. */
export function wantsLocalTls() {
  if (env.TLS === 'off') return false
  if (env.TLS === 'on') return true
  return env.BASE_URL.startsWith('https://') && isLocalHost(baseUrlHost())
}

/** localhost, 127.0.0.1, ::1 und – falls anders – der Host aus BASE_URL. */
function certificateHosts() {
  const host = baseUrlHost()
  const names = [...LOOPBACK_NAMES]
  const ips = [...LOOPBACK_IPS]
  if (isIP(host)) {
    if (!ips.includes(host)) ips.push(host)
  } else if (!names.includes(host)) {
    names.push(host)
  }
  return { names, ips }
}

function fullMask(ip: string) {
  return isIP(ip) === 6 ? 'FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF' : '255.255.255.255'
}

/**
 * Die CA darf nur für die eigenen Adressen ausstellen (Name Constraints): Wer den Schlüssel aus
 * dem Volume liest, kann damit keine fremden Websites fälschen.
 */
function opensslConfig(hosts: { names: string[]; ips: string[] }, id: string) {
  const permitted = [
    ...hosts.names.map((n) => `permitted;DNS:${n}`),
    ...hosts.ips.map((ip) => `permitted;IP:${ip}/${fullMask(ip)}`),
  ]
  const altNames = [...hosts.names.map((n) => `DNS:${n}`), ...hosts.ips.map((ip) => `IP:${ip}`)]
  return `[req]
distinguished_name = dn
prompt = no
[dn]
O = OpenLitBase
CN = OpenLitBase lokal ${id}
[ca]
basicConstraints = critical, CA:TRUE, pathlen:0
keyUsage = critical, keyCertSign, cRLSign
subjectKeyIdentifier = hash
nameConstraints = critical, ${permitted.join(', ')}
[server]
basicConstraints = critical, CA:FALSE
keyUsage = critical, digitalSignature
extendedKeyUsage = serverAuth
subjectAltName = ${altNames.join(', ')}
authorityKeyIdentifier = keyid
`
}

function openssl(args: string[]) {
  execFileSync('openssl', args, { stdio: ['ignore', 'ignore', 'pipe'] })
}

const newKey = ['-newkey', 'ec', '-pkeyopt', 'ec_paramgen_curve:prime256v1', '-nodes']

function createCa(dir: string, config: string, hostsKey: string) {
  openssl(['req', '-x509', ...newKey, '-keyout', path.join(dir, 'ca.key'), '-out', path.join(dir, 'ca.crt'),
    '-days', String(CA_DAYS), '-config', config, '-extensions', 'ca'])
  writeFileSync(path.join(dir, 'ca.hosts'), hostsKey)
}

function createServerCertificate(dir: string, config: string) {
  const csr = path.join(dir, 'server.csr')
  openssl(['req', '-new', ...newKey, '-keyout', path.join(dir, 'server.key'), '-out', csr,
    '-subj', '/O=OpenLitBase/CN=localhost'])
  openssl(['x509', '-req', '-in', csr, '-CA', path.join(dir, 'ca.crt'), '-CAkey', path.join(dir, 'ca.key'),
    '-set_serial', `0x${randomBytes(16).toString('hex')}`, '-days', String(SERVER_DAYS),
    '-extfile', config, '-extensions', 'server', '-out', path.join(dir, 'server.crt')])
  rmSync(csr)
}

function readText(file: string) {
  return existsSync(file) ? readFileSync(file, 'utf8') : ''
}

/** Serverzertifikat noch brauchbar: von der aktuellen CA, alle Adressen, nicht kurz vor Ablauf. */
function serverUsable(dir: string, ca: X509Certificate, hosts: { names: string[]; ips: string[] }) {
  const pem = readText(path.join(dir, 'server.crt'))
  if (!pem || !existsSync(path.join(dir, 'server.key'))) return false
  const cert = new X509Certificate(pem)
  const altNames = cert.subjectAltName ?? ''
  return (
    cert.checkIssued(ca) &&
    new Date(cert.validTo).getTime() - Date.now() > RENEW_BEFORE_MS &&
    hosts.names.every((n) => altNames.includes(`DNS:${n}`)) &&
    hosts.ips.every((ip) => cert.checkIP(ip) !== undefined)
  )
}

/**
 * Legt CA und Serverzertifikat in CERT_DIR an bzw. erneuert sie. Die CA bleibt, solange ihre
 * Adressen passen – so muss man ihr nur einmal vertrauen; das Serverzertifikat wird still erneuert.
 */
export function ensureLocalCertificate(): TlsSetup {
  const dir = path.resolve(env.CERT_DIR)
  mkdirSync(dir, { recursive: true })
  const hosts = certificateHosts()
  const hostsKey = [...hosts.names, ...hosts.ips].join(' ')
  const config = path.join(dir, 'openssl.cnf')
  const caFile = path.join(dir, 'ca.crt')

  let caPem = readText(caFile)
  const caCreated =
    !caPem ||
    readText(path.join(dir, 'ca.hosts')) !== hostsKey ||
    new Date(new X509Certificate(caPem).validTo).getTime() - Date.now() < RENEW_BEFORE_MS
  try {
    writeFileSync(config, opensslConfig(hosts, randomBytes(3).toString('hex')))
    if (caCreated) {
      createCa(dir, config, hostsKey)
      caPem = readText(caFile)
    }
    const ca = new X509Certificate(caPem)
    if (!serverUsable(dir, ca, hosts)) createServerCertificate(dir, config)
  } finally {
    rmSync(config, { force: true })
  }

  const cert = readFileSync(path.join(dir, 'server.crt'))
  return {
    key: readFileSync(path.join(dir, 'server.key')),
    cert,
    caPem,
    validTo: new Date(new X509Certificate(cert).validTo),
    caCreated,
  }
}
