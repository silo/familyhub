// server/api/settings/security.put.ts
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcrypt'
import { db } from '../../db'
import { familyMembers } from '../../db/schema'

const updateSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = updateSchema.safeParse(body)

  if (!result.success) {
    return {
      error: result.error.issues[0]?.message || 'Invalid input',
    }
  }

  const { currentPassword, newPassword } = result.data

  try {
    // Get admin family member
    const adminMember = await db.query.familyMembers.findFirst({
      where: eq(familyMembers.isAdmin, true),
    })

    if (!adminMember || !adminMember.passwordHash) {
      return { error: 'Admin not found' }
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, adminMember.passwordHash)

    if (!isValid) {
      return {
        error: 'Invalid current password',
      }
    }

    // Hash new password
    const SALT_ROUNDS = 12
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)

    // Update admin family member password
    await db
      .update(familyMembers)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(familyMembers.id, adminMember.id))

    return {
      data: {
        success: true,
        message: 'Password updated successfully',
      },
    }
  } catch (error) {
    console.error('Security update failed:', error)
    return { error: 'Failed to update password' }
  }
})
