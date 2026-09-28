import { pgTable, text } from 'drizzle-orm/pg-core'

/** Einstellungen der Instanz als Schlüssel/Wert, z. B. die zufällige ID für die Update-Prüfung. */
export const instance = pgTable('instance', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
})
