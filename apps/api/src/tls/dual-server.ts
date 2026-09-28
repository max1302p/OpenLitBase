import { createServer as createHttpServer } from 'node:http'
import { createServer as createHttpsServer } from 'node:https'
import { createServer as createNetServer, type Server } from 'node:net'
import { getRequestListener } from '@hono/node-server'

type Fetch = Parameters<typeof getRequestListener>[0]

/** Erstes Byte eines TLS-Handshakes (ContentType „handshake“). */
const TLS_HANDSHAKE = 0x16

/**
 * http und https auf demselben Port: Das erste Byte jeder Verbindung entscheidet. So bleibt
 * `http://localhost:1450` (Extension, curl, Reverse-Proxy) gültig, während Word https bekommt.
 */
export function listenHttpAndHttps(
  fetch: Fetch,
  port: number,
  tls: { key: Buffer; cert: Buffer },
  onListening: () => void,
) {
  const listener = getRequestListener(fetch)
  const http = createHttpServer(listener)
  const https = createHttpsServer(tls, listener)

  const server: Server = createNetServer((socket) => {
    socket.once('data', (chunk) => {
      socket.pause()
      socket.unshift(chunk)
      ;(chunk[0] === TLS_HANDSHAKE ? https : http).emit('connection', socket)
      process.nextTick(() => socket.resume())
    })
    socket.on('error', () => socket.destroy())
  })
  server.listen(port, '0.0.0.0', onListening)

  return {
    close(callback: () => void) {
      server.close(callback)
      http.closeIdleConnections()
      https.closeIdleConnections()
    },
  }
}
