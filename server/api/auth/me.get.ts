// server/api/auth/me.get.ts
import { db } from '../../db'
import { userSessions } from '../../db/schema'
import { eq, and, gt } from 'drizzle-orm'

export default defineEventHandler(async event => {
  // Get token from Authorization header
  const authHeader = getHeader(event, 'authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return {
      error: 'No session token provided',
    }
  }

  const token = authHeader.slice(7) // Remove 'Bearer ' prefix

  try {
    // Find valid session with user data
    const session = await db.query.userSessions.findFirst({
      where: and(eq(userSessions.sessionToken, token), gt(userSessions.expiresAt, new Date())),
      with: {
        familyMember: true,
      },
    })

    if (!session) {
      return {
        error: 'Invalid or expired session',
      }
    }

    const member = session.familyMember

    return {
      data: {
        id: member.id,
        name: member.name,
        avatarType: member.avatarType,
        avatarValue: member.avatarValue,
        color: member.color,
        isAdmin: member.isAdmin,
      },
    }
  } catch (error) {
    console.error('Get user failed:', error)
    return {
      error: 'Failed to get user information',
    }
  }
})
