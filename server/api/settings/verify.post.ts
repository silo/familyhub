// server/api/settings/verify.post.ts
import { z } from 'zod'
import bcrypt from 'bcrypt'
import { db } from '../../db'

const verifySchema = z.object({
  credential: z.string().min(1, 'Credential is required'),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = verifySchema.safeParse(body)

  if (!result.success) {
    return {
      error: result.error.issues[0]?.message || 'Invalid input',
    }
  }

  const { credential } = result.data

  try {
    const adminRecord = await db.query.admin.findFirst()

    if (!adminRecord) {
      return {
        error: 'Admin not configured',
      }
    }

    let isValid = false

    if (adminRecord.authType === 'password' && adminRecord.passwordHash) {
      isValid = await bcrypt.compare(credential, adminRecord.passwordHash)
    } else if (adminRecord.authType === 'pin' && adminRecord.pinHash) {
      isValid = await bcrypt.compare(credential, adminRecord.pinHash)
    }

    if (!isValid) {
      return {
        error: adminRecord.authType === 'pin' ? 'Invalid PIN' : 'Invalid password',
      }
    }

    return {
      data: {
        success: true,
        authType: adminRecord.authType,
      },
    }
  } catch (error) {
    console.error('Verification failed:', error)
    return {
      error: 'Verification failed',
    }
  }
})
