// server/api/chores/complete-by-nfc.post.ts
import { z } from 'zod'
import { requireAuth } from '../../utils/auth'
import { completeChore, findChoreByNfcTag } from '../../utils/chore-completion'

const nfcCompleteSchema = z.object({
  tagId: z.string().min(1, 'NFC tag ID is required'),
})

export default defineEventHandler(async (event) => {
  // Require authenticated user
  const user = await requireAuth(event)

  const body = await readBody(event)
  const result = nfcCompleteSchema.safeParse(body)

  if (!result.success) {
    return {
      error: result.error.issues[0]?.message || 'Invalid input',
    }
  }

  const { tagId } = result.data

  try {
    // Find chore by NFC tag ID
    const chore = await findChoreByNfcTag(tagId)

    if (!chore) {
      return { error: 'NFC tag not linked to any chore' }
    }

    // Complete the chore as the authenticated user
    const completion = await completeChore(chore.id, user.id)

    if (!completion.success) {
      return {
        error: completion.error,
        ...(completion.cooldownEndsAt && { cooldownEndsAt: completion.cooldownEndsAt }),
      }
    }

    return {
      data: {
        completion: completion.completion,
        pointsEarned: completion.pointsEarned,
        choreName: completion.choreName,
        completedByName: completion.completedByName,
      },
    }
  } catch (error) {
    console.error('NFC completion failed:', error)
    return { error: 'Failed to complete chore' }
  }
})
