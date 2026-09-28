/** Öffentliches DiceBear; gehostete Instanzen setzen AVATAR_URL (z. B. einen eigenen DiceBear-Server). */
export const DEFAULT_AVATAR_URL = 'https://api.dicebear.com/10.x'

let base: string | null = null

/**
 * Avatar-Server der verbundenen Instanz – der API-Client setzt ihn nach dem Laden von /api/config.
 * Vorher liefern die Funktionen nichts, die Avatare zeigen Initialen (keine Anfrage an einen fremden Server).
 */
export function setAvatarBase(url: string) {
  base = url.replace(/\/+$/, '')
}

/** Generierter Avatar pro Konto (DiceBear „clay“, Seed = User-ID – enthält keine persönlichen Daten). */
export function avatarUrl(userId: string) {
  return base ? `${base}/clay/svg?seed=${encodeURIComponent(userId)}` : undefined
}

/** Initialen-Bild für Projekte und Institutionen ohne Logo (DiceBear „initials“, Seed = Name). */
export function initialsAvatarUrl(name: string) {
  return base ? `${base}/initials/svg?seed=${encodeURIComponent(name)}` : undefined
}
