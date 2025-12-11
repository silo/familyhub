// server/api/family-members/[id].delete.ts
import { eq } from 'drizzle-orm'
import { db, familyMembers } from '../../db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) {
    return { error: 'Invalid ID' }
  }

  try {
    // Check if member exists and is not admin
    const member = await db.query.familyMembers.findFirst({
      where: eq(familyMembers.id, Number(id)),
    })

    if (!member) {
      return { error: 'Family member not found' }
    }

    if (member.isAdmin) {
      return { error: 'Cannot delete the admin account' }
    }

    // Delete (will cascade to completions, transactions, activity via FK)
    await db.delete(familyMembers).where(eq(familyMembers.id, Number(id)))

    return { data: { success: true } }
  } catch (error) {
    console.error('Failed to delete family member:', error)
    return { error: 'Failed to delete family member' }
  }
})
