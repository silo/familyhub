// server/api/setup/status.get.ts
import { db } from '../../db'

export default defineEventHandler(async () => {
  try {
    // Check if admin and at least one family member exist
    const adminRecord = await db.query.admin.findFirst()
    const familyMemberRecord = await db.query.familyMembers.findFirst()

    const isSetupComplete = !!(adminRecord && familyMemberRecord)

    return {
      data: {
        isSetupComplete,
        hasAdmin: !!adminRecord,
        hasFamilyMember: !!familyMemberRecord,
      },
    }
  } catch (error) {
    // If database connection fails, setup is not complete
    console.error('Setup status check failed:', error)
    return {
      data: {
        isSetupComplete: false,
        hasAdmin: false,
        hasFamilyMember: false,
        error: 'Database connection failed',
      },
    }
  }
})
