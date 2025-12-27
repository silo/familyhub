// server/api/setup/status.get.ts
import { db } from '../../db'

export default defineEventHandler(async () => {
  try {
    // Check if admin family member exists (with isAdmin = true)
    const adminMember = await db.query.familyMembers.findFirst({
      where: (fm, { eq }) => eq(fm.isAdmin, true),
    })

    const isSetupComplete = !!adminMember

    return {
      data: {
        isSetupComplete,
        hasAdmin: !!adminMember,
        hasFamilyMember: !!adminMember,
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
