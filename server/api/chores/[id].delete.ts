// server/api/chores/[id].delete.ts
import { eq } from 'drizzle-orm'
import { db, chores } from '../../db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) {
    return { error: 'Invalid ID' }
  }

  const query = getQuery(event)
  const hardDelete = query.hard === 'true'

  try {
    if (hardDelete) {
      // Hard delete - completely remove
      const [deleted] = await db
        .delete(chores)
        .where(eq(chores.id, Number(id)))
        .returning()

      if (!deleted) {
        return { error: 'Chore not found' }
      }
    } else {
      // Soft delete - set deleted_at timestamp
      const [updated] = await db
        .update(chores)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(chores.id, Number(id)))
        .returning()

      if (!updated) {
        return { error: 'Chore not found' }
      }
    }

    return { data: { success: true } }
  } catch (error) {
    console.error('Failed to delete chore:', error)
    return { error: 'Failed to delete chore' }
  }
})
