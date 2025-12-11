// server/api/activity/index.get.ts
// Get activity log entries
import { desc, sql } from 'drizzle-orm'
import { db, activityLog, familyMembers, chores } from '../../db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 50, 100)
  const offset = Number(query.offset) || 0

  // Get activity log with related data
  const activities = await db
    .select({
      id: activityLog.id,
      type: activityLog.type,
      familyMemberId: activityLog.familyMemberId,
      choreId: activityLog.choreId,
      metadata: activityLog.metadata,
      createdAt: activityLog.createdAt,
      memberName: familyMembers.name,
      memberColor: familyMembers.color,
      memberAvatarType: familyMembers.avatarType,
      memberAvatarValue: familyMembers.avatarValue,
      choreTitle: chores.title,
    })
    .from(activityLog)
    .leftJoin(familyMembers, sql`${activityLog.familyMemberId} = ${familyMembers.id}`)
    .leftJoin(chores, sql`${activityLog.choreId} = ${chores.id}`)
    .orderBy(desc(activityLog.createdAt))
    .limit(limit)
    .offset(offset)

  // Transform to include avatar URLs
  const activitiesWithAvatars = activities.map(activity => ({
    id: activity.id,
    type: activity.type,
    familyMemberId: activity.familyMemberId,
    choreId: activity.choreId,
    metadata: activity.metadata,
    createdAt: activity.createdAt,
    familyMember: activity.memberName ? {
      name: activity.memberName,
      color: activity.memberColor,
      avatarUrl: activity.memberAvatarType === 'custom'
        ? activity.memberAvatarValue
        : `https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(activity.memberAvatarValue || '')}`,
    } : null,
    chore: activity.choreTitle ? {
      title: activity.choreTitle,
    } : null,
  }))

  return { data: activitiesWithAvatars }
})
