import { serve } from '@hono/node-server'
import { createApp } from './app'
import { schedulePurge } from './auth/cleanup'
import { scheduleBackups } from './backup'
import { ensureLocalUser } from './auth/local-user'
import { pool } from './db/client'
import { runMigrations } from './db/migrate'
import { env } from './env'
import { renderBanner, renderFatal, renderTrustHint } from './startup/banner'
import { runStartupChecks } from './startup/checks'
import { listenHttpAndHttps } from './tls/dual-server'
import { ensureLocalCertificate, wantsLocalTls, type TlsSetup } from './tls/local-certificate'
import { migrateLocalFilesToS3 } from './storage'
import { scheduleUpdateCheck } from './update-check'
import { readVersion } from './version'

try {
  await runMigrations()
} catch (error) {
  console.error(renderFatal('Datenbank nicht erreichbar oder Migration fehlgeschlagen', error))
  process.exit(1)
}

let tls: TlsSetup | undefined
if (wantsLocalTls()) {
  try {
    tls = ensureLocalCertificate()
  } catch (error) {
    console.error(renderFatal('HTTPS-Zertifikat konnte nicht erzeugt werden (openssl?)', error))
    process.exit(1)
  }
}

const localUser = env.AUTH_MODE === 'single' ? await ensureLocalUser() : undefined
schedulePurge()

// Umstieg auf S3: vorhandene lokale Dateien einmalig in den Bucket kopieren
try {
  const moved = await migrateLocalFilesToS3()
  if (moved.copied) console.log(`✔ ${moved.copied} Datei(en) nach S3 übernommen (${moved.skipped} schon vorhanden)`)
} catch (error) {
  console.error('✖ Übernahme der Dateien nach S3 fehlgeschlagen:', error)
}
scheduleBackups()
scheduleUpdateCheck()
const checks = await runStartupChecks(localUser?.email, tls)
const app = createApp({ caPem: tls?.caPem })

const onListening = () => {
  console.log(renderBanner({ version: readVersion(), mode: env.AUTH_MODE, baseUrl: env.BASE_URL, port: env.PORT }, checks))
  if (tls?.caCreated) console.log(renderTrustHint(env.BASE_URL))
}

const server = tls
  ? listenHttpAndHttps(app.fetch, env.PORT, tls, onListening)
  : serve({ fetch: app.fetch, port: env.PORT, hostname: '0.0.0.0' }, onListening)

/** `docker stop` schickt SIGTERM – sauber beenden statt nach 10 s hart abgebrochen zu werden. */
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, () => {
    console.log(`${signal} empfangen – fahre herunter …`)
    server.close(() => void pool.end().finally(() => process.exit(0)))
    setTimeout(() => process.exit(0), 5000).unref()
  })
}
