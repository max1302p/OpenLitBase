import type { TermMatrixData } from '@litbase/shared'
import { jsonb, pgTable, uuid } from 'drizzle-orm/pg-core'
import { projects } from './projects'

export const termMatrix = pgTable('term_matrix', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .unique()
    .references(() => projects.id, { onDelete: 'cascade' }),
  data: jsonb('data').$type<TermMatrixData>().notNull().default({ columns: [] }),
})
