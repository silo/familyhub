// server/api/family-members/[id].put.ts
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, familyMembers, PASTEL_COLORS } from '../../db'

const updateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  avatarType: z.enum(['dicebear', 'custom']),
  avatarValue: z.string().min(1, 'Avatar is required'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
})

export default defineEventHandler(async (event) => {
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

  const { name, avatarType, avatarValue, color } = result.data

  // Validate color is from allowed palette
  if (!PASTEL_COLORS.includes(color as any)) {
    return {
      error: 'Invalid color selection',
    }
  }

  try {
    const [updated] = await db
      .update(familyMembers)
      .set({
        name,
        avatarType,
        avatarValue,
        color,
        updatedAt: new Date(),
      })
      .where(eq(familyMembers.id, Number(id)))
      .returning()

    if (!updated) {
      return { error: 'Family member not found' }
    }

    return { data: updated }
  } catch (error) {
    console.error('Failed to update family member:', error)
    return { error: 'Failed to update family member' }
  }
})
