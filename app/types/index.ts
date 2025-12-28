// app/types/index.ts
// Types for the FamilyHub application

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

// ============================================================================
// Base Types (matching database schema)
// ============================================================================

export interface Admin {
  id: number
  passwordHash: string | null
  pinHash: string | null
  authType: string
  createdAt: Date
  updatedAt: Date
}

export interface Settings {
  id: number
  currency: string
  pointValue: string
  createdAt: Date
  updatedAt: Date
}

export interface FamilyMember {
  id: number
  name: string
  avatarType: string
  avatarValue: string
  color: string
  isAdmin: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: number
  name: string
  color: string | null
  icon: string | null
  createdAt: Date
}

export interface Chore {
  id: number
  title: string
  description: string | null
  points: number
  categoryId: number | null
  assigneeId: number | null
  isPermanent: boolean
  recurringType: string | null
  recurringConfig: RecurringConfig | null
  dueDate: string | null
  dueTime: string | null
  endDate: string | null
  cooldownType: string | null
  cooldownHours: number | null
  qrToken: string | null
  nfcTagId: string | null
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface ChoreCompletion {
  id: number
  choreId: number
  completedBy: number
  pointsEarned: number
  completedAt: Date
}

export interface PointTransaction {
  id: number
  familyMemberId: number
  amount: number
  type: 'earned' | 'redeemed'
  description: string | null
  referenceId: number | null
  createdAt: Date
}

export interface ActivityLog {
  id: number
  type: string
  familyMemberId: number | null
  choreId: number | null
  metadata: Record<string, unknown> | null
  createdAt: Date
}

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
// Extended Types for UI
// ============================================================================

/**
 * Family member with computed avatar URL
 */
export interface FamilyMemberWithAvatar {
  id: number
  name: string
  avatarType: string
  avatarValue: string
  avatarUrl: string // Computed URL for display
  color: string
  isAdmin: boolean
  totalPoints?: number
  createdAt: Date
  updatedAt: Date
}

/**
 * Chore with relations loaded
 */
export interface ChoreWithRelations {
  id: number
  title: string
  description: string | null
  points: number
  categoryId: number | null
  assigneeId: number | null
  type: 'one-time' | 'permanent' | 'recurring'
  recurringConfig: RecurringConfig | null
  dueDate: string | null
  dueTime: string | null
  endDate: string | null
  cooldownType: 'unlimited' | 'daily' | 'hours' | null
  cooldownHours: number | null
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
  category?: {
    id: number
    name: string
    color: string | null
    icon: string | null
  } | null
  assignee?: FamilyMemberWithAvatar | null
  lastCompletion?: ChoreCompletion | null
}

/**
 * Activity log entry with relations
 */
export interface ActivityLogEntry {
  id: number
  type: 'chore_completed' | 'points_redeemed' | 'member_added' | 'chore_created'
  familyMemberId: number | null
  choreId: number | null
  metadata: ActivityMetadata | null
  createdAt: Date
  familyMember?: FamilyMemberWithAvatar | null
  chore?: {
    id: number
    title: string
  } | null
}

/**
 * Dashboard stats
 */
export interface DashboardStats {
  totalChoresCompleted: number
  totalPointsEarned: number
  topContributor?: FamilyMemberWithAvatar | null
  streakDays: number
}

/**
 * Cooldown status for a chore
 */
export interface CooldownStatus {
  canComplete: boolean
  reason?: string
  nextAvailableAt?: Date
  remainingTime?: string
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  data: T
}

export interface ApiError {
  error: string
  statusCode?: number
}
