import { createReadStream } from 'node:fs'
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { env, s3Configured } from '../env'

/**
 * Ablage für hochgeladene Dateien (PDF-Anhänge, Logos). Schlüssel = Pfad relativ zu UPLOAD_DIR
 * (z. B. `attachments/<uuid>.pdf`), so bleiben Datenbank und beide Ablagen austauschbar.
 * Mit S3_* in der Umgebung liegt alles im Bucket, sonst im Dateisystem.
 */
export interface FileStorage {
  kind: 's3' | 'local'
  /** Für das Start-Banner, z. B. `s3.example.com/openlitbase-uploads` oder `/data/uploads`. */
  label: string
  put(key: string, body: Uint8Array, contentType: string): Promise<void>
  /** Inhalt als Web-Stream, `null` wenn die Datei fehlt. */
  get(key: string): Promise<ReadableStream | null>
  delete(keys: string[]): Promise<void>
  /** Alle Dateien unter einem Ordner (z. B. `attachments/`) mit Änderungsdatum. */
  list(prefix: string): Promise<{ key: string; modified: Date }[]>
  /** Erreichbar und beschreibbar? */
  check(): Promise<boolean>
}

export function createS3Client() {
  return new S3Client({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    credentials: { accessKeyId: env.S3_ACCESS_KEY_ID!, secretAccessKey: env.S3_SECRET_ACCESS_KEY! },
    // S3-kompatible Server (Garage, MinIO …) kennen nicht alle neuen Prüfsummen des SDK.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  })
}

const isMissing = (error: unknown) => {
  const e = error as { name?: string; $metadata?: { httpStatusCode?: number } }
  return e.name === 'NoSuchKey' || e.name === 'NotFound' || e.$metadata?.httpStatusCode === 404
}

function s3Storage(): FileStorage {
  const client = createS3Client()
  const Bucket = env.S3_BUCKET!
  const host = env.S3_ENDPOINT ? new URL(env.S3_ENDPOINT).host : 'S3'
  return {
    kind: 's3',
    label: `${host}/${Bucket}`,
    async put(Key, Body, ContentType) {
      await client.send(new PutObjectCommand({ Bucket, Key, Body, ContentType }))
    },
    async get(Key) {
      try {
        const res = await client.send(new GetObjectCommand({ Bucket, Key }))
        return res.Body ? res.Body.transformToWebStream() : null
      } catch (error) {
        if (isMissing(error)) return null
        throw error
      }
    },
    async delete(keys) {
      if (keys.length === 0) return
      // S3 erlaubt höchstens 1000 Schlüssel pro Aufruf
      for (let i = 0; i < keys.length; i += 1000) {
        const Objects = keys.slice(i, i + 1000).map((Key) => ({ Key }))
        await client.send(new DeleteObjectsCommand({ Bucket, Delete: { Objects, Quiet: true } }))
      }
    },
    async list(Prefix) {
      const found: { key: string; modified: Date }[] = []
      let token: string | undefined
      do {
        const res = await client.send(new ListObjectsV2Command({ Bucket, Prefix, ContinuationToken: token }))
        for (const o of res.Contents ?? []) if (o.Key && o.LastModified) found.push({ key: o.Key, modified: o.LastModified })
        token = res.IsTruncated ? res.NextContinuationToken : undefined
      } while (token)
      return found
    },
    async check() {
      try {
        await client.send(new HeadBucketCommand({ Bucket }))
        return true
      } catch {
        return false
      }
    },
  }
}

function localStorage(): FileStorage {
  const abs = (key: string) => path.resolve(env.UPLOAD_DIR, key)
  return {
    kind: 'local',
    label: path.resolve(env.UPLOAD_DIR),
    async put(key, body) {
      await mkdir(path.dirname(abs(key)), { recursive: true })
      await writeFile(abs(key), body)
    },
    async get(key) {
      try {
        await stat(abs(key))
      } catch {
        return null
      }
      return Readable.toWeb(createReadStream(abs(key))) as ReadableStream
    },
    async delete(keys) {
      await Promise.all(keys.map((k) => rm(abs(k), { force: true })))
    },
    async list(prefix) {
      const folder = prefix.replace(/\/$/, '')
      const keys = await localFiles(folder)
      return Promise.all(keys.map(async (key) => ({ key, modified: (await stat(abs(key))).mtime })))
    },
    async check() {
      try {
        await mkdir(env.UPLOAD_DIR, { recursive: true })
        await writeFile(abs('.write-test'), '')
        await rm(abs('.write-test'), { force: true })
        return true
      } catch {
        return false
      }
    },
  }
}

export const storage: FileStorage = s3Configured ? s3Storage() : localStorage()

/** Alle Dateien unter UPLOAD_DIR/<ordner> (für die Übernahme nach S3). */
async function localFiles(folder: string) {
  try {
    const names = await readdir(path.resolve(env.UPLOAD_DIR, folder))
    return names.filter((n) => !n.startsWith('.')).map((n) => `${folder}/${n}`)
  } catch {
    return []
  }
}

/**
 * Beim Umstieg auf S3: vorhandene lokale Dateien einmalig in den Bucket kopieren (was dort schon
 * liegt, wird übersprungen). Die lokalen Dateien bleiben liegen und können danach gelöscht werden.
 */
export async function migrateLocalFilesToS3() {
  if (storage.kind !== 's3') return { copied: 0, skipped: 0 }
  const client = createS3Client()
  const Bucket = env.S3_BUCKET!
  let copied = 0
  let skipped = 0
  for (const key of [...(await localFiles('attachments')), ...(await localFiles('logos'))]) {
    try {
      await client.send(new HeadObjectCommand({ Bucket, Key: key }))
      skipped++
      continue
    } catch (error) {
      if (!isMissing(error)) throw error
    }
    const body = new Uint8Array(await readFile(path.resolve(env.UPLOAD_DIR, key)))
    await storage.put(key, body, key.endsWith('.pdf') ? 'application/pdf' : 'image/png')
    copied++
  }
  return { copied, skipped }
}

