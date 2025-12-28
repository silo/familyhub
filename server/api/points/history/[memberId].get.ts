// server/api/points/history/[memberId].get.ts
// Get point transaction history for a specific member
import { eq, desc, sum } from 'drizzle-orm'
import { db, pointTransactions, familyMembers } from '../../../db'

export default defineEventHandler(async (event) => {
  const memberId = Number(getRouterParam(event, 'memberId'))
  
  if (isNaN(memberId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid member ID'
    })
  }

  // Verify member exists
  const member = await db.query.familyMembers.findFirst({
    where: eq(familyMembers.id, memberId)
  })

  if (!member) {
    throw createError({
      statusCode: 404,
      message: 'Family member not found'
    })
  }

  // Get transaction history
  const transactions = await db
    .select()
    .from(pointTransactions)
    .where(eq(pointTransactions.familyMemberId, memberId))
    .orderBy(desc(pointTransactions.createdAt))
    .limit(50)

  // Calculate total points
  const totalResult = await db
    .select({ total: sum(pointTransactions.amount) })
    .from(pointTransactions)
    .where(eq(pointTransactions.familyMemberId, memberId))

  const totalPoints = Number(totalResult[0]?.total) || 0

  return { 
    data: {
      transactions,
      totalPoints,
    }
  }
})
