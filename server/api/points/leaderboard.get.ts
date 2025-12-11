// server/api/points/leaderboard.get.ts
// Get family members with their points totals for leaderboard
import { eq, sql, desc } from 'drizzle-orm'
import { db, familyMembers, pointTransactions } from '../../db'

export default defineEventHandler(async () => {
  // Get all family members with their point totals
  const members = await db
    .select({
      id: familyMembers.id,
      name: familyMembers.name,
      avatarType: familyMembers.avatarType,
      avatarValue: familyMembers.avatarValue,
      color: familyMembers.color,
      isAdmin: familyMembers.isAdmin,
      totalPoints: sql<number>`COALESCE(SUM(CASE WHEN ${pointTransactions.type} = 'earned' THEN ${pointTransactions.amount} ELSE -${pointTransactions.amount} END), 0)::int`,
    })
    .from(familyMembers)
    .leftJoin(pointTransactions, eq(familyMembers.id, pointTransactions.familyMemberId))
    .groupBy(familyMembers.id)
    .orderBy(desc(sql`COALESCE(SUM(CASE WHEN ${pointTransactions.type} = 'earned' THEN ${pointTransactions.amount} ELSE -${pointTransactions.amount} END), 0)`))

  // Add avatar URLs
  const membersWithAvatars = members.map(member => ({
    ...member,
    avatarUrl: member.avatarType === 'custom'
      ? member.avatarValue
      : `https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(member.avatarValue)}`,
  }))

  return { data: membersWithAvatars }
})
