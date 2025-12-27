// server/api/chores/[id]/nfc.put.ts
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { chores } from '../../../db/schema'

const nfcSchema = z.object({
  nfcTagId: z.string().max(64).nullable(),
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) {
    return { error: 'Invalid chore ID' }
  }

  const body = await readBody(event)
  const result = nfcSchema.safeParse(body)

  if (!result.success) {
    return {
      error: result.error.issues[0]?.message || 'Invalid input',
    }
  }

  const { nfcTagId } = result.data
  const choreId = Number(id)

  try {
    // Verify chore exists
    const chore = await db.query.chores.findFirst({
      where: eq(chores.id, choreId),
    })

    if (!chore) {
      return { error: 'Chore not found' }
    }

    // If setting a new NFC tag, check it's not already bound to another chore
    if (nfcTagId) {
      const existingChore = await db.query.chores.findFirst({
        where: eq(chores.nfcTagId, nfcTagId),
      })

      if (existingChore && existingChore.id !== choreId) {
        return { 
          error: 'NFC tag is already bound to another chore',
          boundTo: existingChore.title,
        }
      }
    }

    // Update the chore's NFC tag
    const [updatedChore] = await db
      .update(chores)
      .set({
        nfcTagId,
        updatedAt: new Date(),
      })
      .where(eq(chores.id, choreId))
      .returning()

    return {
      data: {
        success: true,
        chore: updatedChore,
        message: nfcTagId ? 'NFC tag bound successfully' : 'NFC tag unbound successfully',
      },
    }
  } catch (error) {
    console.error('Failed to update NFC binding:', error)
    return { error: 'Failed to update NFC binding' }
  }
})
