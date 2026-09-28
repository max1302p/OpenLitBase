import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { de } from '@litbase/shared'
import sharp from 'sharp'
import { storage } from '../storage'

export const MAX_LOGO_BYTES = 5 * 1024 * 1024
const LOGO_SIZE = 512
/** Rundungstoleranz für „quadratisch“ (z. B. 1000 × 990 ist noch ok). */
const SQUARE_TOLERANCE = 0.02

export type LogoResult = { ok: true; path: string } | { ok: false; error: string }

/** Masse nach EXIF-Drehung (Handyfotos sind oft hochkant gespeichert). */
async function orientedSize(bytes: Uint8Array) {
  const meta = await sharp(bytes, { density: 600 }).metadata()
  const rotated = (meta.orientation ?? 1) >= 5
  return rotated ? { width: meta.height, height: meta.width } : { width: meta.width, height: meta.height }
}

/**
 * Institutions-Logo übernehmen: beliebiges Bildformat (inkl. SVG), Seitenverhältnis 1:1 Pflicht.
 * Transparenz wird weiss hinterlegt; gespeichert wird immer ein PNG mit max. 512 × 512 px.
 */
export async function saveLogo(file: File): Promise<LogoResult> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (bytes.length > MAX_LOGO_BYTES) return { ok: false, error: de.errors.logoInvalid }

  let size: { width: number; height: number }
  try {
    size = await orientedSize(bytes)
  } catch {
    return { ok: false, error: de.errors.logoInvalid }
  }
  if (!size.width || !size.height) return { ok: false, error: de.errors.logoInvalid }
  const deviation = Math.abs(size.width - size.height) / Math.max(size.width, size.height)
  if (deviation > SQUARE_TOLERANCE) {
    return { ok: false, error: de.errors.logoNotSquare(size.width, size.height) }
  }

  const png = await sharp(bytes, { density: 600 })
    .rotate()
    .resize(LOGO_SIZE, LOGO_SIZE, { fit: 'cover', withoutEnlargement: true })
    .flatten({ background: '#ffffff' })
    .png()
    .toBuffer()

  const relative = `logos/${randomUUID()}.png`
  await storage.put(relative, new Uint8Array(png), 'image/png')
  return { ok: true, path: relative }
}

export async function deleteLogo(relative: string | null) {
  if (relative) await storage.delete([relative])
}

/** Öffentliche Logo-URL; der Dateiname dient als Versions-Parameter gegen den Browser-Cache. */
export function logoUrl(id: string, logoPath: string | null) {
  return logoPath ? `/api/institutions/${id}/logo?v=${path.basename(logoPath, path.extname(logoPath))}` : null
}
