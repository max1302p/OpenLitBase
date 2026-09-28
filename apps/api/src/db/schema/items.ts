import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { user } from './auth'

export const items = pgTable(
  'items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    /** CSL-JSON – Single Source of Truth für alle Metadaten. */
    csl: jsonb('csl').$type<Record<string, unknown>>().notNull(),
    doi: text('doi'),
    isbn: text('isbn'),
    url: text('url'),
    tags: text('tags').array().notNull().default([]),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('items_user_id_idx').on(t.userId),
    index('items_doi_idx').on(t.doi),
    index('items_isbn_idx').on(t.isbn),
  ],
)
