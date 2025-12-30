// server/api/chores/[id]/complete.post.ts
import { z } from 'zod'
import { eq, and, desc } from 'drizzle-orm'
import {
  db,
  chores,
  choreCompletions,
  pointTransactions,
  activityLog,
  familyMembers,
} from '../../../db'

const completeSchema = z.object({
  completedBy: z.coerce.number().int().positive('Family member is required'),
})

export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) {
    return { error: 'Invalid chore ID' }
  }

  const body = await readBody(event)
  const result = completeSchema.safeParse(body)

  if (!result.success) {
    return {
      error: result.error.issues[0]?.message || 'Invalid input',
    }
  }

  const { completedBy } = result.data
  const choreId = Number(id)

  try {
    // Fetch the chore
    const chore = await db.query.chores.findFirst({
      where: eq(chores.id, choreId),
    })

    if (!chore) {
      return { error: 'Chore not found' }
    }

    if (chore.deletedAt) {
      return { error: 'Chore has been deleted' }
    }

    // Verify family member exists
    const member = await db.query.familyMembers.findFirst({
      where: eq(familyMembers.id, completedBy),
    })

    if (!member) {
      return { error: 'Family member not found' }
    }

    // Check cooldown for permanent chores
    if (chore.isPermanent && chore.cooldownType && chore.cooldownType !== 'unlimited') {
      const lastCompletion = await db.query.choreCompletions.findFirst({
        where: and(
          eq(choreCompletions.choreId, choreId),
          eq(choreCompletions.completedBy, completedBy)
        ),
        orderBy: [desc(choreCompletions.completedAt)],
      })

      if (lastCompletion) {
        const now = new Date()
        let cooldownEnd: Date

        if (chore.cooldownType === 'daily') {
          // Daily cooldown - resets at midnight
          cooldownEnd = new Date(lastCompletion.completedAt)
          cooldownEnd.setDate(cooldownEnd.getDate() + 1)
          cooldownEnd.setHours(0, 0, 0, 0)
        } else if (chore.cooldownType === 'hours' && chore.cooldownHours) {
          // Hours cooldown
          cooldownEnd = new Date(lastCompletion.completedAt)
          cooldownEnd.setTime(cooldownEnd.getTime() + chore.cooldownHours * 60 * 60 * 1000)
        } else {
          cooldownEnd = now // No cooldown
        }

        if (now < cooldownEnd) {
          return {
            error: 'Chore is on cooldown',
            cooldownEndsAt: cooldownEnd.toISOString(),
          }
        }
      }
    }

    // Create completion record
    const [completion] = await db
      .insert(choreCompletions)
      .values({
        choreId,
        completedBy,
        pointsEarned: chore.points,
      })
      .returning()

    if (!completion) {
      return { error: 'Failed to create completion record' }
    }

    // Award points if any
    if (chore.points > 0) {
      await db.insert(pointTransactions).values({
        familyMemberId: completedBy,
        amount: chore.points,
        type: 'earned',
        description: `Completed: ${chore.title}`,
        referenceId: completion.id,
      })
    }

    // Log activity
    await db.insert(activityLog).values({
      type: 'chore_completed',
      familyMemberId: completedBy,
      choreId,
      metadata: {
        points: chore.points,
        choreName: chore.title,
      },
    })

    // Handle one-time chores (soft delete)
    if (!chore.isPermanent && !chore.recurringType) {
      await db
        .update(chores)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(chores.id, choreId))
    }

    return {
      data: {
        completion,
        pointsEarned: chore.points,
        choreName: chore.title,
        completedByName: member.name,
      },
    }
  } catch (error) {
    console.error('Failed to complete chore:', error)
    return { error: 'Failed to complete chore' }
  }
})
