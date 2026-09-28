import type { user } from './db/schema'

export type User = typeof user.$inferSelect

export interface AppEnv {
  Variables: {
    user: User
  }
}
