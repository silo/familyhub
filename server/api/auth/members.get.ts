// server/api/auth/members.get.ts
// Returns list of family members for login selection (public endpoint)
import { db } from '../../db'

export default defineEventHandler(async () => {
  try {
    const members = await db.query.familyMembers.findMany({
      columns: {
        id: true,
        name: true,
        avatarType: true,
        avatarValue: true,
        color: true,
        passwordHash: true, // Need this to check if password is set
      },
    })

    // Map to login-safe response (don't expose actual hash)
    const membersWithLoginStatus = members.map(member => ({
      id: member.id,
      name: member.name,
      avatarType: member.avatarType,
      avatarValue: member.avatarValue,
      color: member.color,
      hasPassword: !!member.passwordHash,
    }))

    return {
      data: membersWithLoginStatus,
    }
  } catch (error) {
    console.error('Failed to get members:', error)
    return {
      error: 'Failed to get family members',
    }
  }
})
