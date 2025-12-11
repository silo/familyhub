// server/api/categories/index.get.ts
import { db, categories } from '../../db'
import { asc } from 'drizzle-orm'

export default defineEventHandler(async () => {
  try {
    const allCategories = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.name))

    return {
      data: allCategories,
    }
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return {
      error: 'Failed to fetch categories',
    }
  }
})
