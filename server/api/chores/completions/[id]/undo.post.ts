// server/api/chores/completions/[id]/undo.post.ts
import { eq } from 'drizzle-orm'
import { db, chores, choreCompletions, pointTransactions, activityLog } from '../../../../db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) {
    return { error: 'Invalid completion ID' }
  }

  const completionId = Number(id)

  try {
    // Fetch the completion
    const completion = await db.query.choreCompletions.findFirst({
      where: eq(choreCompletions.id, completionId),
      with: {
        chore: true,
      },
    })

    if (!completion) {
      return { error: 'Completion not found' }
    }

    // Delete the completion
    await db.delete(choreCompletions).where(eq(choreCompletions.id, completionId))

    // Remove points transaction if any
    if (completion.pointsEarned > 0) {
      await db
        .delete(pointTransactions)
        .where(eq(pointTransactions.referenceId, completionId))
    }

    // Remove activity log entry
    await db
      .delete(activityLog)
      .where(
        eq(activityLog.choreId, completion.choreId)
      )

    // Restore one-time chore if it was soft-deleted
    if (completion.chore && !completion.chore.isPermanent && !completion.chore.recurringType) {
      await db
        .update(chores)
        .set({
          deletedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(chores.id, completion.choreId))
    }

    return {
      data: {
        success: true,
        choreId: completion.choreId,
      },
    }
  } catch (error) {
    console.error('Failed to undo completion:', error)
    return { error: 'Failed to undo completion' }
  }
})
