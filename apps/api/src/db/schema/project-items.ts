import type { ItemProtocol } from '@litbase/shared'
import { index, jsonb, pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core'
import { items } from './items'
import { projects } from './projects'

export const projectItems = pgTable(
  'project_items',
  {
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    itemId: uuid('item_id')
      .notNull()
      .references(() => items.id, { onDelete: 'cascade' }),
    /** Rechercheprotokoll: Einordnung dieses Titels für dieses Projekt. */
    protocol: jsonb('protocol').$type<ItemProtocol>().notNull().default({}),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.itemId] }), index('project_items_item_id_idx').on(t.itemId)],
)
