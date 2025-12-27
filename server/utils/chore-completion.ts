// server/utils/chore-completion.ts
import { eq, and, desc } from 'drizzle-orm'
import { db } from '../db'
import { chores, choreCompletions, pointTransactions, activityLog, familyMembers } from '../db/schema'

export interface CompleteChoreResult {
  success: true
  completion: typeof choreCompletions.$inferSelect
  pointsEarned: number
  choreName: string
  completedByName: string
}

export interface CompleteChoreError {
  success: false
  error: string
  cooldownEndsAt?: string
}

export type CompleteChoreResponse = CompleteChoreResult | CompleteChoreError

/**
 * Complete a chore for a family member
 * Shared logic used by direct completion and QR/NFC completion
 */
export async function completeChore(
  choreId: number,
  completedBy: number
): Promise<CompleteChoreResponse> {
  try {
    // Fetch the chore
    const chore = await db.query.chores.findFirst({
      where: eq(chores.id, choreId),
    })

    if (!chore) {
      return { success: false, error: 'Chore not found' }
    }

    if (chore.deletedAt) {
      return { success: false, error: 'Chore has been deleted' }
    }

    // Verify family member exists
    const member = await db.query.familyMembers.findFirst({
      where: eq(familyMembers.id, completedBy),
    })

    if (!member) {
      return { success: false, error: 'Family member not found' }
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
            success: false,
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
      success: true,
      completion,
      pointsEarned: chore.points,
      choreName: chore.title,
      completedByName: member.name,
    }
  } catch (error) {
    console.error('Failed to complete chore:', error)
    return { success: false, error: 'Failed to complete chore' }
  }
}

/**
 * Find a chore by QR token
 */
export async function findChoreByQrToken(token: string) {
  return db.query.chores.findFirst({
    where: and(
      eq(chores.qrToken, token),
      eq(chores.deletedAt, null as any) // Not deleted
    ),
  })
}

/**
 * Find a chore by NFC tag ID
 */
export async function findChoreByNfcTag(tagId: string) {
  return db.query.chores.findFirst({
    where: and(
      eq(chores.nfcTagId, tagId),
      eq(chores.deletedAt, null as any) // Not deleted
    ),
  })
}
