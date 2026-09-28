import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { user } from '../db/schema'

export const LOCAL_USER_ID = 'local'

/** Legt im Modus "single" den impliziten lokalen User an, falls er noch fehlt. */
export async function ensureLocalUser() {
  await db
    .insert(user)
    .values({
      id: LOCAL_USER_ID,
      name: 'Lokaler Benutzer',
      email: 'local@litbase.invalid',
      emailVerified: true,
    })
    .onConflictDoNothing()
  const [local] = await db.select().from(user).where(eq(user.id, LOCAL_USER_ID))
  if (!local) throw new Error('Lokaler User konnte nicht angelegt werden.')
  return local
}
