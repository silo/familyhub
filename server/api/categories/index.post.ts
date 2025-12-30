// server/api/categories/index.post.ts
import { z } from 'zod'
import { db, categories } from '../../db'

const createSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullable()
    .optional(),
  icon: z.string().max(50).nullable().optional(),
})

export default defineEventHandler(async event => {
  const body = await readBody(event)
  const result = createSchema.safeParse(body)

  if (!result.success) {
    return {
      error: result.error.issues[0]?.message || 'Invalid input',
    }
  }

  const { name, color, icon } = result.data

  try {
    const [newCategory] = await db
      .insert(categories)
      .values({
        name,
        color: color || null,
        icon: icon || null,
      })
      .returning()

    return {
      data: newCategory,
    }
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === '23505') {
      return { error: 'A category with this name already exists' }
    }
    console.error('Failed to create category:', error)
    return { error: 'Failed to create category' }
  }
})
