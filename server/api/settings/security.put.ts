// server/api/settings/security.put.ts
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcrypt'
import { db, admin } from '../../db'

const updateSchema = z.object({
  currentCredential: z.string().min(1, 'Current credential is required'),
  newAuthType: z.enum(['password', 'pin']),
  newCredential: z.string().min(1, 'New credential is required'),
}).refine((data) => {
  if (data.newAuthType === 'password') {
    return data.newCredential.length >= 6
  }
  if (data.newAuthType === 'pin') {
    return /^\d{4}$/.test(data.newCredential)
  }
  return false
}, {
  message: 'Password must be at least 6 characters, or PIN must be exactly 4 digits',
  path: ['newCredential'],
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = updateSchema.safeParse(body)

  if (!result.success) {
    return {
      error: result.error.issues[0]?.message || 'Invalid input',
    }
  }

  const { currentCredential, newAuthType, newCredential } = result.data

  try {
    // Get current admin
    const adminRecord = await db.query.admin.findFirst()

    if (!adminRecord) {
      return { error: 'Admin not found' }
    }

    // Verify current credential
    let isValid = false
    if (adminRecord.authType === 'password' && adminRecord.passwordHash) {
      isValid = await bcrypt.compare(currentCredential, adminRecord.passwordHash)
    } else if (adminRecord.authType === 'pin' && adminRecord.pinHash) {
      isValid = await bcrypt.compare(currentCredential, adminRecord.pinHash)
    }

    if (!isValid) {
      return {
        error: adminRecord.authType === 'pin' ? 'Invalid current PIN' : 'Invalid current password',
      }
    }

    // Hash new credential
    const SALT_ROUNDS = 12
    let passwordHash: string | null = null
    let pinHash: string | null = null

    if (newAuthType === 'password') {
      passwordHash = await bcrypt.hash(newCredential, SALT_ROUNDS)
    } else {
      pinHash = await bcrypt.hash(newCredential, SALT_ROUNDS)
    }

    // Update admin
    await db
      .update(admin)
      .set({
        authType: newAuthType,
        passwordHash,
        pinHash,
        updatedAt: new Date(),
      })
      .where(eq(admin.id, adminRecord.id))

    return {
      data: {
        success: true,
        authType: newAuthType,
      },
    }
  } catch (error) {
    console.error('Failed to update security settings:', error)
    return { error: 'Failed to update security settings' }
  }
})
