// server/api/chores/index.post.ts
import { z } from 'zod'
import { db, chores } from '../../db'

const recurringConfigSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('daily') }),
  z.object({ type: z.literal('weekly'), dayOfWeek: z.number().min(0).max(6) }),
  z.object({ type: z.literal('biweekly'), dayOfWeek: z.number().min(0).max(6), startDate: z.string() }),
  z.object({ type: z.literal('interval'), days: z.number().positive() }),
  z.object({ type: z.literal('days'), daysOfWeek: z.array(z.number().min(0).max(6)) }),
])

const createSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).nullable().optional(),
  points: z.coerce.number().int().min(0).default(0),
  categoryId: z.coerce.number().int().positive().nullable().optional(),
  assigneeId: z.coerce.number().int().positive().nullable().optional(),
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
  const body = await readBody(event)
  const result = createSchema.safeParse(body)

  if (!result.success) {
    return {
      error: result.error.issues[0]?.message || 'Invalid input',
    }
  }

  const data = result.data

  try {
    const [newChore] = await db
      .insert(chores)
      .values({
        title: data.title,
        description: data.description || null,
        points: data.points,
        categoryId: data.categoryId || null,
        assigneeId: data.assigneeId || null,
        isPermanent: data.isPermanent,
        recurringType: data.recurringType || null,
        recurringConfig: data.recurringConfig || null,
        dueDate: data.dueDate || null,
        dueTime: data.dueTime || null,
        endDate: data.endDate || null,
        cooldownType: data.isPermanent ? (data.cooldownType || 'unlimited') : null,
        cooldownHours: data.cooldownType === 'hours' ? data.cooldownHours : null,
      })
      .returning()

    return {
      data: newChore,
    }
  } catch (error) {
    console.error('Failed to create chore:', error)
    return { error: 'Failed to create chore' }
  }
})
