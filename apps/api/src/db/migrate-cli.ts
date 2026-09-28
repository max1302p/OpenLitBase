import { pool } from './client'
import { runMigrations } from './migrate'

await runMigrations()
await pool.end()
console.log('Migrationen ausgeführt.')
