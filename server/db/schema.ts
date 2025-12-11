// server/db/schema.ts
import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  date,
  time,
  decimal,
  jsonb,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ============================================================================
// Admin Table
// ============================================================================
export const admin = pgTable('admin', {
  id: serial('id').primaryKey(),
  passwordHash: varchar('password_hash', { length: 255 }),
  pinHash: varchar('pin_hash', { length: 255 }),
  authType: varchar('auth_type', { length: 20 }).notNull().default('password'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ============================================================================
// Settings Table
// ============================================================================
export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  pointValue: decimal('point_value', { precision: 10, scale: 2 }).notNull().default('1.00'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ============================================================================
// Family Members Table
// ============================================================================
export const familyMembers = pgTable('family_members', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  avatarType: varchar('avatar_type', { length: 20 }).notNull().default('dicebear'),
  avatarValue: varchar('avatar_value', { length: 500 }).notNull(),
  color: varchar('color', { length: 7 }).notNull(),
  isAdmin: boolean('is_admin').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const familyMembersRelations = relations(familyMembers, ({ many }) => ({
  assignedChores: many(chores),
  choreCompletions: many(choreCompletions),
  pointTransactions: many(pointTransactions),
  activityLogs: many(activityLog),
}))

// ============================================================================
// Categories Table
// ============================================================================
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  color: varchar('color', { length: 7 }),
  icon: varchar('icon', { length: 50 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const categoriesRelations = relations(categories, ({ many }) => ({
  chores: many(chores),
}))

// ============================================================================
// Chores Table
// ============================================================================
export const chores = pgTable(
  'chores',
  {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    points: integer('points').notNull().default(0),
    categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
    assigneeId: integer('assignee_id').references(() => familyMembers.id, { onDelete: 'set null' }),
    isPermanent: boolean('is_permanent').notNull().default(false),
    recurringType: varchar('recurring_type', { length: 20 }),
    recurringConfig: jsonb('recurring_config'),
    dueDate: date('due_date'),
    dueTime: time('due_time'),
    endDate: date('end_date'),
    cooldownType: varchar('cooldown_type', { length: 20 }),
    cooldownHours: integer('cooldown_hours'),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_chores_due_date').on(table.dueDate, table.deletedAt),
  ]
)

export const choresRelations = relations(chores, ({ one, many }) => ({
  category: one(categories, {
    fields: [chores.categoryId],
    references: [categories.id],
  }),
  assignee: one(familyMembers, {
    fields: [chores.assigneeId],
    references: [familyMembers.id],
  }),
  completions: many(choreCompletions),
  activityLogs: many(activityLog),
}))

// ============================================================================
// Chore Completions Table
// ============================================================================
export const choreCompletions = pgTable(
  'chore_completions',
  {
    id: serial('id').primaryKey(),
    choreId: integer('chore_id')
      .notNull()
      .references(() => chores.id, { onDelete: 'cascade' }),
    completedBy: integer('completed_by')
      .notNull()
      .references(() => familyMembers.id, { onDelete: 'cascade' }),
    pointsEarned: integer('points_earned').notNull().default(0),
    completedAt: timestamp('completed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_chore_completions_member').on(table.completedBy, table.completedAt),
    index('idx_chore_completions_cooldown').on(table.choreId, table.completedAt),
  ]
)

export const choreCompletionsRelations = relations(choreCompletions, ({ one }) => ({
  chore: one(chores, {
    fields: [choreCompletions.choreId],
    references: [chores.id],
  }),
  completedByMember: one(familyMembers, {
    fields: [choreCompletions.completedBy],
    references: [familyMembers.id],
  }),
}))

// ============================================================================
// Point Transactions Table
// ============================================================================
export const pointTransactions = pgTable(
  'point_transactions',
  {
    id: serial('id').primaryKey(),
    familyMemberId: integer('family_member_id')
      .notNull()
      .references(() => familyMembers.id, { onDelete: 'cascade' }),
    amount: integer('amount').notNull(),
    type: varchar('type', { length: 20 }).notNull(), // 'earned' or 'redeemed'
    description: varchar('description', { length: 200 }),
    referenceId: integer('reference_id'), // chore_completion.id if earned
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_point_transactions_member').on(table.familyMemberId, table.createdAt),
  ]
)

export const pointTransactionsRelations = relations(pointTransactions, ({ one }) => ({
  familyMember: one(familyMembers, {
    fields: [pointTransactions.familyMemberId],
    references: [familyMembers.id],
  }),
}))

// ============================================================================
// Activity Log Table
// ============================================================================
export const activityLog = pgTable(
  'activity_log',
  {
    id: serial('id').primaryKey(),
    type: varchar('type', { length: 30 }).notNull(), // 'chore_completed', 'points_redeemed'
    familyMemberId: integer('family_member_id').references(() => familyMembers.id, {
      onDelete: 'set null',
    }),
    choreId: integer('chore_id').references(() => chores.id, { onDelete: 'set null' }),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_activity_log_timeline').on(table.createdAt),
    index('idx_activity_log_member').on(table.familyMemberId, table.createdAt),
  ]
)

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  familyMember: one(familyMembers, {
    fields: [activityLog.familyMemberId],
    references: [familyMembers.id],
  }),
  chore: one(chores, {
    fields: [activityLog.choreId],
    references: [chores.id],
  }),
}))

// ============================================================================
// Type Exports
// ============================================================================
export type Admin = typeof admin.$inferSelect
export type NewAdmin = typeof admin.$inferInsert

export type Settings = typeof settings.$inferSelect
export type NewSettings = typeof settings.$inferInsert

export type FamilyMember = typeof familyMembers.$inferSelect
export type NewFamilyMember = typeof familyMembers.$inferInsert

export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert

export type Chore = typeof chores.$inferSelect
export type NewChore = typeof chores.$inferInsert

export type ChoreCompletion = typeof choreCompletions.$inferSelect
export type NewChoreCompletion = typeof choreCompletions.$inferInsert

export type PointTransaction = typeof pointTransactions.$inferSelect
export type NewPointTransaction = typeof pointTransactions.$inferInsert

export type ActivityLog = typeof activityLog.$inferSelect
export type NewActivityLog = typeof activityLog.$inferInsert

// ============================================================================
// Recurring Config Types
// ============================================================================
export interface RecurringConfigDaily {
  type: 'daily'
}

export interface RecurringConfigWeekly {
  type: 'weekly'
  dayOfWeek: number // 0-6 (Sunday = 0)
}

export interface RecurringConfigBiweekly {
  type: 'biweekly'
  dayOfWeek: number
  startDate: string // ISO date string
}

export interface RecurringConfigInterval {
  type: 'interval'
  days: number
}

export interface RecurringConfigDays {
  type: 'days'
  daysOfWeek: number[] // 0-6
}

export type RecurringConfig =
  | RecurringConfigDaily
  | RecurringConfigWeekly
  | RecurringConfigBiweekly
  | RecurringConfigInterval
  | RecurringConfigDays

// ============================================================================
// Activity Metadata Types
// ============================================================================
export interface ChoreCompletedMetadata {
  points: number
  choreName: string
}

export interface PointsRedeemedMetadata {
  amount: number
  moneyValue: string
}

export type ActivityMetadata = ChoreCompletedMetadata | PointsRedeemedMetadata

// ============================================================================
// Pastel Color Palette
// ============================================================================
export const PASTEL_COLORS = [
  '#FFB3BA', // Pink
  '#FFDFBA', // Peach
  '#FFFFBA', // Yellow
  '#BAFFC9', // Mint
  '#BAE1FF', // Sky Blue
  '#E0BBE4', // Lavender
  '#D4A5A5', // Dusty Rose
  '#A5D4D4', // Teal
  '#C9C9FF', // Periwinkle
  '#FFD4BA', // Apricot
  '#D4BAFF', // Lilac
  '#BAFFD4', // Seafoam
] as const

export type PastelColor = (typeof PASTEL_COLORS)[number]
