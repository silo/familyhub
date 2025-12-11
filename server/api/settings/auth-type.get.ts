// server/api/settings/auth-type.get.ts
import { db } from '../../db'

export default defineEventHandler(async () => {
  try {
    const adminRecord = await db.query.admin.findFirst()

    if (!adminRecord) {
      return {
        error: 'Admin not configured',
      }
    }

    return {
      data: {
        authType: adminRecord.authType,
      },
    }
  } catch (error) {
    console.error('Failed to get auth type:', error)
    return {
      error: 'Failed to get auth type',
    }
  }
})
