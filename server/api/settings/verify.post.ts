// server/api/settings/verify.post.ts
import { z } from 'zod'
import bcrypt from 'bcrypt'
import { db } from '../../db'
import { familyMembers } from '../../db/schema'
import { eq } from 'drizzle-orm'

const verifySchema = z.object({
  password: z.string().min(1, 'Password is required'),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = verifySchema.safeParse(body)

  if (!result.success) {
    return {
      error: result.error.issues[0]?.message || 'Invalid input',
    }
  }

  const { password } = result.data

  try {
    // Find admin family member
    const adminMember = await db.query.familyMembers.findFirst({
      where: eq(familyMembers.isAdmin, true),
    })

    if (!adminMember || !adminMember.passwordHash) {
      return {
        error: 'Admin not configured',
      }
    }

    // Verify password
    const isValid = await bcrypt.compare(password, adminMember.passwordHash)

    if (!isValid) {
      return {
        error: 'Invalid password',
      }
    }

    return {
      data: {
        success: true,
      },
    }
  } catch (error) {
    console.error('Verification failed:', error)
    return {
      error: 'Verification failed',
    }
  }
})
