// server/api/points/redeem.post.ts
import { z } from 'zod'
import { db, familyMembers, pointTransactions, activityLog, settings } from '../../db'
import { eq, sum, and } from 'drizzle-orm'

const redeemSchema = z.object({
  familyMemberId: z.number().int().positive(),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  // Validate input
  const parsed = redeemSchema.safeParse(body)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const { familyMemberId } = parsed.data

  try {
    // Verify family member exists
    const member = await db.query.familyMembers.findFirst({
      where: eq(familyMembers.id, familyMemberId),
    })

    if (!member) {
      return { error: 'Family member not found' }
    }

    // Calculate current balance
    const result = await db
      .select({
        earned: sum(pointTransactions.amount).mapWith(Number),
      })
      .from(pointTransactions)
      .where(
        and(
          eq(pointTransactions.familyMemberId, familyMemberId),
          eq(pointTransactions.type, 'earned')
        )
      )

    const redeemedResult = await db
      .select({
        redeemed: sum(pointTransactions.amount).mapWith(Number),
      })
      .from(pointTransactions)
      .where(
        and(
          eq(pointTransactions.familyMemberId, familyMemberId),
          eq(pointTransactions.type, 'redeemed')
        )
      )

    const totalEarned = result[0]?.earned || 0
    const totalRedeemed = redeemedResult[0]?.redeemed || 0
    const currentBalance = totalEarned - totalRedeemed

    if (currentBalance <= 0) {
      return { error: 'No points to redeem' }
    }

    // Get settings for money value calculation
    const appSettings = await db.query.settings.findFirst()
    const pointValue = parseFloat(appSettings?.pointValue || '1.00')
    const currency = appSettings?.currency || 'USD'
    const moneyValue = (currentBalance * pointValue).toFixed(2)

    // Create redemption transaction
    const [transaction] = await db
      .insert(pointTransactions)
      .values({
        familyMemberId,
        amount: currentBalance,
        type: 'redeemed',
        description: `Redeemed ${currentBalance} points for ${currency} ${moneyValue}`,
      })
      .returning()

    if (!transaction) {
      return { error: 'Failed to create transaction' }
    }

    // Log activity
    await db.insert(activityLog).values({
      type: 'points_redeemed',
      familyMemberId,
      metadata: {
        amount: currentBalance,
        moneyValue: `${currency} ${moneyValue}`,
        transactionId: transaction.id,
      },
    })

    return {
      data: {
        transaction,
        pointsRedeemed: currentBalance,
        moneyValue: `${currency} ${moneyValue}`,
        memberName: member.name,
      },
    }
  } catch (error) {
    console.error('Failed to redeem points:', error)
    return { error: 'Failed to redeem points' }
  }
})
