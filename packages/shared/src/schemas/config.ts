import { z } from 'zod'

export const authModeSchema = z.enum(['single', 'multi'])
export type AuthMode = z.infer<typeof authModeSchema>

/** Öffentliche Server-Konfiguration, die Web, Extension und Add-in ohne Login abrufen. */
export const legalLinksSchema = z.object({
  imprintUrl: z.string().nullable(),
  privacyUrl: z.string().nullable(),
  termsUrl: z.string().nullable(),
})
export type LegalLinks = z.infer<typeof legalLinksSchema>

export const configSchema = z.object({
  authMode: authModeSchema,
  appName: z.string(),
  /** Rechtstexte der Betreiberin (leer bei Selbsthostern ohne Angaben). */
  legal: legalLinksSchema,
  /** Avatar-Server (DiceBear-API); fehlt bei älteren Servern → öffentliches DiceBear. */
  avatarUrl: z.string().optional(),
  /** Quellcode der laufenden Version (AGPL § 13). */
  sourceUrl: z.string().optional(),
})

export const updateStatusSchema = z.object({
  enabled: z.boolean(),
  current: z.string(),
  latest: z.string().nullable(),
  updateAvailable: z.boolean(),
  url: z.string().nullable(),
  checkedAt: z.string().nullable(),
})
export type UpdateStatus = z.infer<typeof updateStatusSchema>
export type Config = z.infer<typeof configSchema>
