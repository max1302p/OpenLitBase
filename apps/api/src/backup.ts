import { spawn } from 'node:child_process'
import { DeleteObjectsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { backupConfigured, env } from './env'
import { createS3Client } from './storage'

/**
 * Nächtliche Datenbank-Sicherung: `pg_dump` (Custom-Format) direkt in BACKUP_S3_BUCKET,
 * ältere als BACKUP_RETENTION_DAYS werden gelöscht. Wiederherstellen:
 * `pg_restore --clean --if-exists -d <DATABASE_URL> litbase-<zeit>.dump`.
 * Hochgeladene Dateien liegen mit S3 ohnehin im Bucket und brauchen keine eigene Sicherung.
 */
const PREFIX = 'postgres/'
const HOUR = 60 * 60 * 1000

export async function runBackup() {
  const client = createS3Client()
  const Bucket = env.BACKUP_S3_BUCKET!
  const key = `${PREFIX}litbase-${new Date().toISOString().replace(/[:.]/g, '-')}.dump`

  const dump = spawn('pg_dump', ['--format=custom', '--no-owner', '--no-privileges', env.DATABASE_URL], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let stderr = ''
  dump.stderr.on('data', (d) => (stderr += d))
  const exited = new Promise<number>((resolve, reject) => {
    dump.on('error', reject)
    dump.on('close', (code) => resolve(code ?? 1))
  })

  const upload = new Upload({ client, params: { Bucket, Key: key, Body: dump.stdout, ContentType: 'application/octet-stream' } })
  await upload.done()
  const code = await exited
  if (code !== 0) {
    // Unvollständige Sicherung nicht liegen lassen
    await client.send(new DeleteObjectsCommand({ Bucket, Delete: { Objects: [{ Key: key }] } }))
    throw new Error(`pg_dump beendet mit ${code}: ${stderr.trim()}`)
  }

  const removed = await pruneBackups()
  console.log(`✔ Datenbank-Sicherung ${Bucket}/${key}${removed ? `, ${removed} alte gelöscht` : ''}`)
  return key
}

async function listBackups() {
  const client = createS3Client()
  const found: { key: string; date: Date }[] = []
  let token: string | undefined
  do {
    const res = await client.send(new ListObjectsV2Command({ Bucket: env.BACKUP_S3_BUCKET!, Prefix: PREFIX, ContinuationToken: token }))
    for (const o of res.Contents ?? []) if (o.Key && o.LastModified) found.push({ key: o.Key, date: o.LastModified })
    token = res.IsTruncated ? res.NextContinuationToken : undefined
  } while (token)
  return found.sort((a, b) => a.date.getTime() - b.date.getTime())
}

async function pruneBackups() {
  const limit = Date.now() - env.BACKUP_RETENTION_DAYS * 24 * HOUR
  const old = (await listBackups()).filter((b) => b.date.getTime() < limit)
  if (old.length === 0) return 0
  await createS3Client().send(
    new DeleteObjectsCommand({ Bucket: env.BACKUP_S3_BUCKET!, Delete: { Objects: old.map((b) => ({ Key: b.key })), Quiet: true } }),
  )
  return old.length
}

/** Letzte Sicherung (für das Start-Banner). */
export async function latestBackup() {
  return (await listBackups()).at(-1)
}

/** Täglich zur BACKUP_HOUR (UTC); fehlt eine Sicherung der letzten 24 h, eine Minute nach dem Start. */
export function scheduleBackups() {
  if (!backupConfigured) return
  const safeRun = () => runBackup().catch((error) => console.error('✖ Datenbank-Sicherung fehlgeschlagen:', error))
  const scheduleNext = () => {
    const next = new Date()
    next.setUTCHours(env.BACKUP_HOUR, 0, 0, 0)
    if (next.getTime() <= Date.now()) next.setUTCDate(next.getUTCDate() + 1)
    setTimeout(() => {
      void safeRun().finally(scheduleNext)
    }, next.getTime() - Date.now()).unref()
  }
  scheduleNext()
  void latestBackup()
    .then((last) => {
      if (!last || Date.now() - last.date.getTime() > 24 * HOUR) setTimeout(() => void safeRun(), 60_000).unref()
    })
    .catch((error) => console.error('✖ Sicherungen nicht lesbar:', error))
}
