import { index, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import { user } from './auth'
import { projects } from './projects'

/**
 * Geteilte Projekte: eine Zeile pro eingeladener Person. `userId` ist leer, solange die Person noch
 * kein Konto hat – bei der Registrierung mit derselben E-Mail wird sie automatisch zugeordnet.
 */
export const projectMembers = pgTable(
  'project_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
    /** Klein geschrieben. */
    email: text('email').notNull(),
    /** `editor` (bearbeiten) oder `viewer` (lesen). */
    role: text('role').$type<'editor' | 'viewer'>().notNull(),
    invitedBy: text('invited_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('project_members_project_email_unique').on(t.projectId, t.email),
    index('project_members_user_id_idx').on(t.userId),
    index('project_members_email_idx').on(t.email),
  ],
)
