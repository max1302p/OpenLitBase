import type { ProjectResearch } from '@litbase/shared'
import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { user } from './auth'

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    /** null = Standard-Zitierstil des Accounts (user_settings). */
    citationStyle: text('citation_style'),
    /** Forschungsdreisatz und Forschungsfrage (Projektübersicht). */
    research: jsonb('research').$type<ProjectResearch>().notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('projects_user_id_idx').on(t.userId)],
)
