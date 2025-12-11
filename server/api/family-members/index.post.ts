// server/api/family-members/index.post.ts
import { z } from 'zod'
import { db, familyMembers, PASTEL_COLORS } from '../../db'

const createSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  avatarType: z.enum(['dicebear', 'custom']).default('dicebear'),
  avatarValue: z.string().min(1, 'Avatar is required'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = createSchema.safeParse(body)

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
    const [newMember] = await db
      .insert(familyMembers)
      .values({
        name,
        avatarType,
        avatarValue,
        color,
        isAdmin: false,
      })
      .returning()

    return {
      data: newMember,
    }
  } catch (error) {
    console.error('Failed to create family member:', error)
    return {
      error: 'Failed to create family member',
    }
  }
})
