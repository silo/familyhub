// server/api/categories/[id].delete.ts
import { eq } from 'drizzle-orm'
import { db, categories } from '../../db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) {
    return { error: 'Invalid ID' }
  }

  try {
    const [deleted] = await db
      .delete(categories)
      .where(eq(categories.id, Number(id)))
      .returning()

    if (!deleted) {
      return { error: 'Category not found' }
    }

    return { data: { success: true } }
  } catch (error) {
    console.error('Failed to delete category:', error)
    return { error: 'Failed to delete category' }
  }
})
