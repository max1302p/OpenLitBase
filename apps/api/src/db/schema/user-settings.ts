import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { user } from './auth'

/** Einstellungen pro Account, z. B. der Standard-Zitierstil für neue und nicht festgelegte Projekte. */
export const userSettings = pgTable('user_settings', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  citationStyle: text('citation_style').notNull().default('ieee-de'),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})
