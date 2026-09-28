import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const allowedDomains = pgTable('allowed_domains', {
  id: uuid('id').primaryKey().defaultRandom(),
  domain: text('domain').notNull().unique(),
  name: text('name').notNull(),
  logoPath: text('logo_path'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
