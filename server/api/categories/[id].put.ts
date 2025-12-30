// server/api/categories/[id].put.ts
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, categories } from '../../db'

const updateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullable()
    .optional(),
  icon: z.string().max(50).nullable().optional(),
})

export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) {
    return { error: 'Invalid ID' }
  }

  const body = await readBody(event)
  const result = updateSchema.safeParse(body)

  if (!result.success) {
    return {
      error: result.error.issues[0]?.message || 'Invalid input',
    }
  }

  const { name, color, icon } = result.data

  try {
    const [updated] = await db
      .update(categories)
      .set({
        name,
        color: color || null,
        icon: icon || null,
      })
      .where(eq(categories.id, Number(id)))
      .returning()

    if (!updated) {
      return { error: 'Category not found' }
    }

    return { data: updated }
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === '23505') {
      return { error: 'A category with this name already exists' }
    }
    console.error('Failed to update category:', error)
    return { error: 'Failed to update category' }
  }
})
