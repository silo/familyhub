// server/api/auth/login.post.ts
import { z } from 'zod'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { db } from '../../db'
import { familyMembers, userSessions } from '../../db/schema'
import { eq } from 'drizzle-orm'

const loginSchema = z.object({
  familyMemberId: z.number().int().positive(),
  password: z.string().min(1, 'Password is required'),
  deviceName: z.string().max(100).optional(),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = loginSchema.safeParse(body)

  if (!result.success) {
    return {
      error: result.error.issues[0]?.message || 'Invalid input',
    }
  }

  const { familyMemberId, password, deviceName } = result.data

  try {
    // Find family member
    const member = await db.query.familyMembers.findFirst({
      where: eq(familyMembers.id, familyMemberId),
    })

    if (!member) {
      return {
        error: 'User not found',
      }
    }

    // Check if member has a password set
    if (!member.passwordHash) {
      return {
        error: 'Password not set for this user',
      }
    }

    // Verify password
    const isValid = await bcrypt.compare(password, member.passwordHash)
    if (!isValid) {
      return {
        error: 'Invalid password',
      }
    }

    // Generate session token
    const sessionToken = `familyhub_${crypto.randomBytes(32).toString('hex')}`
    
    // Session expires in 30 days
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Create session
    await db.insert(userSessions).values({
      familyMemberId: member.id,
      sessionToken,
      deviceName: deviceName || 'Unknown device',
      expiresAt,
    })

    return {
      data: {
        token: sessionToken,
        expiresAt: expiresAt.toISOString(),
        user: {
          id: member.id,
          name: member.name,
          avatarType: member.avatarType,
          avatarValue: member.avatarValue,
          color: member.color,
          isAdmin: member.isAdmin,
        },
      },
    }
  } catch (error) {
    console.error('Login failed:', error)
    return {
      error: 'Login failed. Please try again.',
    }
  }
})
