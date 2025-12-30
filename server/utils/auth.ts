// server/utils/auth.ts
import type { H3Event } from 'h3'
import { db } from '../db'
import { userSessions, familyMembers } from '../db/schema'
import { eq, and, gt } from 'drizzle-orm'
import type { FamilyMember } from '../db/schema'

// Extend H3Event context to include user
declare module 'h3' {
  interface H3EventContext {
    user?: Omit<FamilyMember, 'passwordHash'>
  }
}

/**
 * Get the authenticated user from the request
 * Returns null if not authenticated
 */
export async function getAuthUser(event: H3Event): Promise<Omit<FamilyMember, 'passwordHash'> | null> {
  const authHeader = getHeader(event, 'authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.slice(7)

  try {
    const session = await db.query.userSessions.findFirst({
      where: and(
        eq(userSessions.sessionToken, token),
        gt(userSessions.expiresAt, new Date())
      ),
      with: {
        familyMember: true,
      },
    })

    if (!session) {
      return null
    }

    const { passwordHash, ...user } = session.familyMember
    return user
  } catch (error) {
    console.error('Auth check failed:', error)
    return null
  }
}

/**
 * Require authentication - throws 401 if not authenticated
 */
export async function requireAuth(event: H3Event): Promise<Omit<FamilyMember, 'passwordHash'>> {
  const user = await getAuthUser(event)
  
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Authentication required',
    })
  }

  // Store user in context for later use
  event.context.user = user
  return user
}

/**
 * Require admin authentication - throws 403 if not admin
 */
export async function requireAdmin(event: H3Event): Promise<Omit<FamilyMember, 'passwordHash'>> {
  const user = await requireAuth(event)
  
  if (!user.isAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'Admin access required',
    })
  }

  return user
}
