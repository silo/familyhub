// server/api/chores/[id].put.ts
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, chores, choreAssignees } from '../../db'

const recurringConfigSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('daily') }),
  z.object({ type: z.literal('weekly'), dayOfWeek: z.number().min(0).max(6) }),
  z.object({ type: z.literal('biweekly'), dayOfWeek: z.number().min(0).max(6), startDate: z.string() }),
  z.object({ type: z.literal('interval'), days: z.number().positive() }),
  z.object({ type: z.literal('days'), daysOfWeek: z.array(z.number().min(0).max(6)) }),
])

const updateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).nullable().optional(),
  points: z.coerce.number().int().min(0).default(0),
  categoryId: z.coerce.number().int().positive().nullable().optional(),
  assigneeIds: z.array(z.coerce.number().int().positive()).default([]),
  isPermanent: z.boolean().default(false),
  recurringType: z.enum(['daily', 'weekly', 'biweekly', 'custom']).nullable().optional(),
  recurringConfig: recurringConfigSchema.nullable().optional(),
  dueDate: z.string().nullable().optional(),
  dueTime: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  cooldownType: z.enum(['unlimited', 'daily', 'hours']).nullable().optional(),
  cooldownHours: z.coerce.number().int().positive().nullable().optional(),
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) {
    return { error: 'Invalid ID' }
  }

  const body = await readBody(event)
  const result = updateSchema.safeParse(body)

  if (!result.success) {
    return {
      error: result.error.issues[0]?.message || 'Invalid input',
    }
  }

  const data = result.data
  const choreId = Number(id)

  try {
    const [updated] = await db
      .update(chores)
      .set({
        title: data.title,
        description: data.description || null,
        points: data.points,
        categoryId: data.categoryId || null,
        isPermanent: data.isPermanent,
        recurringType: data.recurringType || null,
        recurringConfig: data.recurringConfig || null,
        dueDate: data.dueDate || null,
        dueTime: data.dueTime || null,
        endDate: data.endDate || null,
        cooldownType: data.isPermanent ? (data.cooldownType || 'unlimited') : null,
        cooldownHours: data.cooldownType === 'hours' ? data.cooldownHours : null,
        updatedAt: new Date(),
      })
      .where(eq(chores.id, choreId))
      .returning()

    if (!updated) {
      return { error: 'Chore not found' }
    }

    // Update assignees: delete existing and insert new
    await db.delete(choreAssignees).where(eq(choreAssignees.choreId, choreId))
    
    if (data.assigneeIds.length > 0) {
      await db.insert(choreAssignees).values(
        data.assigneeIds.map((familyMemberId) => ({
          choreId,
          familyMemberId,
        }))
      )
    }

    return { data: updated }
  } catch (error) {
    console.error('Failed to update chore:', error)
    return { error: 'Failed to update chore' }
  }
})
