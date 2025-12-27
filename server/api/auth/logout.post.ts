// server/api/auth/logout.post.ts
import { db } from '../../db'
import { userSessions } from '../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // Get token from Authorization header
  const authHeader = getHeader(event, 'authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      error: 'No session token provided',
    }
  }

  const token = authHeader.slice(7) // Remove 'Bearer ' prefix

  try {
    // Delete the session
    const result = await db
      .delete(userSessions)
      .where(eq(userSessions.sessionToken, token))
      .returning({ id: userSessions.id })

    if (result.length === 0) {
      return {
        error: 'Session not found',
      }
    }

    return {
      data: {
        success: true,
        message: 'Logged out successfully',
      },
    }
  } catch (error) {
    console.error('Logout failed:', error)
    return {
      error: 'Logout failed. Please try again.',
    }
  }
})
