import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { items } from './items'

export const attachments = pgTable(
  'attachments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    itemId: uuid('item_id')
      .notNull()
      .references(() => items.id, { onDelete: 'cascade' }),
    filename: text('filename').notNull(),
    /** Pfad relativ zu UPLOAD_DIR. */
    path: text('path').notNull(),
    mime: text('mime').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('attachments_item_id_idx').on(t.itemId)],
)
