import path from 'node:path'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { db } from './client'

/** Generierte SQL-Migrationen; relativ zum Arbeitsverzeichnis (apps/api im Dev, /app im Container). */
const migrationsFolder = path.resolve('drizzle')

export async function runMigrations() {
  await migrate(db, { migrationsFolder })
}
