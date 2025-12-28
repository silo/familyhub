// server/api/family-members/index.get.ts
import { db, familyMembers } from '../../db'
import { asc } from 'drizzle-orm'

export default defineEventHandler(async () => {
  try {
    const members = await db
      .select()
      .from(familyMembers)
      .orderBy(asc(familyMembers.createdAt))

    // Don't expose actual password hash, just whether one is set
    const sanitizedMembers = members.map(member => ({
      ...member,
      passwordHash: member.passwordHash ? true : false,
    }))

    return {
      data: sanitizedMembers,
    }
  } catch (error) {
    console.error('Failed to fetch family members:', error)
    return {
      error: 'Failed to fetch family members',
    }
  }
})
