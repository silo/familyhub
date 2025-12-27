// server/api/family-members/[id]/password.put.ts
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcrypt'
import { db } from '../../../db'
import { familyMembers } from '../../../db/schema'

const passwordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) {
    return { error: 'Invalid family member ID' }
  }

  const body = await readBody(event)
  const result = passwordSchema.safeParse(body)

  if (!result.success) {
    return {
      error: result.error.issues[0]?.message || 'Invalid input',
    }
  }

  const { password } = result.data
  const memberId = Number(id)

  try {
    // Verify member exists
    const member = await db.query.familyMembers.findFirst({
      where: eq(familyMembers.id, memberId),
    })

    if (!member) {
      return { error: 'Family member not found' }
    }

    // Hash the password
    const SALT_ROUNDS = 12
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    // Update password
    await db
      .update(familyMembers)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(familyMembers.id, memberId))

    return {
      data: {
        success: true,
        message: 'Password set successfully',
      },
    }
  } catch (error) {
    console.error('Failed to set password:', error)
    return { error: 'Failed to set password' }
  }
})
