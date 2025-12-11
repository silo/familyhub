# FamilyHub — Development Roadmap

This document outlines the development phases for FamilyHub v1.

---

## Phase 1: Project Foundation
**Estimated time: 2-3 hours**

### 1.1 Dependencies & Configuration
- [ ] Install NuxtUI 4 (`@nuxt/ui`)
- [ ] Install Drizzle ORM (`drizzle-orm`, `drizzle-kit`)
- [ ] Install PostgreSQL driver (`postgres`)
- [ ] Install Zod (`zod`)
- [ ] Install DiceBear (`@dicebear/core`, `@dicebear/personas`)
- [ ] Install bcrypt for password hashing (`bcrypt`, `@types/bcrypt`)
- [ ] Configure `nuxt.config.ts` with modules
- [ ] Create `drizzle.config.ts`
- [ ] Set up environment variables (`.env`, `.env.example`)

### 1.2 Docker Setup
- [ ] Create `Dockerfile` for production build
- [ ] Create `docker-compose.yml` with:
  - PostgreSQL 16 service
  - FamilyHub app service
  - Volume for database persistence
  - Volume for uploads

### 1.3 Database Connection
- [ ] Create `server/db/index.ts` — Drizzle client
- [ ] Test database connection
- [ ] Set up migration scripts in `package.json`

---

## Phase 2: Database Schema
**Estimated time: 2-3 hours**

### 2.1 Core Tables
- [ ] `admin` table (id, password_hash, pin_hash, created_at, updated_at)
- [ ] `settings` table (id, currency, point_value, created_at, updated_at)
- [ ] `family_members` table (id, name, avatar_type, avatar_seed/url, color, is_admin, created_at, updated_at)
- [ ] `categories` table (id, name, color, icon, created_at)

### 2.2 Chore Tables
- [ ] `chores` table (id, title, description, points, category_id, assignee_id, is_permanent, recurring_type, recurring_config, due_date, end_date, cooldown_type, cooldown_hours, deleted_at, created_at, updated_at)
- [ ] `chore_completions` table (id, chore_id, completed_by, completed_at, points_earned)

### 2.3 Points & Activity Tables
- [ ] `point_transactions` table (id, family_member_id, amount, type, description, created_at)
- [ ] `activity_log` table (id, type, family_member_id, chore_id, metadata, created_at)

### 2.4 Migrations
- [ ] Generate initial migration
- [ ] Test migration up/down
- [ ] Document migration commands

---

## Phase 3: First-Run Setup
**Estimated time: 3-4 hours**

### 3.1 Setup Detection
- [ ] Create server middleware to detect empty database
- [ ] Create `/api/setup/status` endpoint
- [ ] Create route middleware to redirect to `/setup` if needed

### 3.2 Setup Page UI
- [ ] Create `/setup` page with stepper component
- [ ] Step 1: Welcome screen (app name, version, welcome message)
- [ ] Step 2: Create admin password OR PIN (toggle option)
- [ ] Step 3: Create admin as family member (name, avatar, color)
- [ ] Step 4: Optionally add more family members (skip button)
- [ ] Step 5: Success → redirect to dashboard

### 3.3 Login Page
- [ ] Create login page component (shown when entering settings)
- [ ] App name "FamilyHub" display
- [ ] Version number display
- [ ] Welcome message
- [ ] Password/PIN entry field

### 3.4 Setup API
- [ ] Create `/api/setup/complete` endpoint
- [ ] Hash password/PIN with bcrypt
- [ ] Create admin record
- [ ] Create family member records
- [ ] Create default settings (USD currency, 1.00 point value)

---

## Phase 4: Admin Settings Module
**Estimated time: 4-5 hours**

### 4.1 Authentication
- [ ] Create `/api/settings/verify` endpoint (password/PIN check)
- [ ] Create settings auth composable with timeout logic
- [ ] Create password/PIN entry modal component

### 4.2 Settings Layout
- [ ] Create `/settings` layout with sidebar navigation
- [ ] Implement 1-minute inactivity detection
- [ ] Lock screen overlay when timed out
- [ ] Version number in footer (read from `package.json`)

### 4.3 Family Member Management
- [ ] Create `/settings/family-members` page
- [ ] List view with edit/delete actions
- [ ] Add/edit modal with:
  - Name input
  - Avatar picker (DiceBear `personas` style + custom upload)
  - Color picker (12 pastel colors)
- [ ] Delete confirmation modal ("Are you sure? All data will be lost")
- [ ] Hard delete (cascades to completions, transactions, activity)
- [ ] Prevent admin deletion
- [ ] API endpoints: GET, POST, PUT, DELETE

### 4.4 Category Management
- [ ] Create `/settings/categories` page
- [ ] Simple CRUD interface
- [ ] API endpoints

### 4.5 Chore Management
- [ ] Create `/settings/chores` page
- [ ] List view with filters (by category, assignment, active/archived)
- [ ] Add/edit modal with:
  - Title, description
  - Points (optional)
  - Category (optional dropdown)
  - Assignee (optional dropdown, or "Anyone")
  - Permanent toggle
    - If permanent: cooldown options (unlimited, daily, X hours)
  - Recurring configuration
  - Due date/time (optional)
  - End date (optional, for recurring)
- [ ] Soft delete for one-time chores (preserve history)
- [ ] API endpoints with Zod validation

### 4.6 Points Configuration
- [ ] Create `/settings/points-config` page
- [ ] Currency selector (common currencies)
- [ ] Point value input (e.g., "1 point = 0.50 DKK")
- [ ] API endpoint

### 4.7 Security Settings
- [ ] Create `/settings/security` page
- [ ] Change password option
- [ ] Switch to PIN / Switch to password option
- [ ] API endpoints

### 4.8 Backup & Restore
- [ ] Create `/settings/backup` page
- [ ] Download backup button → generates `.sql` dump
- [ ] Upload restore file → confirmation modal → overwrite
- [ ] API endpoints for backup/restore

---

## Phase 5: Chore System
**Estimated time: 5-6 hours**

### 5.1 Chore Display Components
- [ ] `ChoreCard.vue` — Card view item
- [ ] `ChoreListItem.vue` — List view row
- [ ] `ChoreCalendarEvent.vue` — Calendar event
- [ ] Overdue styling (red indicator)
- [ ] Point badge display

### 5.2 Chore Completion Flow
- [ ] "Mark as done" button/action
- [ ] If unassigned → family member selector modal
- [ ] If assigned → complete immediately (no confirmation)
- [ ] API endpoint to record completion
- [ ] Award points to family member
- [ ] Log activity
- [ ] Handle one-time (soft-delete) vs permanent vs recurring
- [ ] **Celebration animation**: Party horn/confetti on completion
- [ ] **Toast notification**: Bottom-right stacked toast
  - "You completed [chore name]" message
  - 5-second undo button
  - Uses NuxtUI toast component

### 5.3 Permanent Chore Cooldown
- [ ] Check cooldown before allowing completion
- [ ] Cooldown types: unlimited, daily (midnight reset), hours
- [ ] Grayed out/disabled UI when on cooldown
- [ ] Query last completion time for cooldown check

### 5.4 Recurring Chore Management
- [ ] End date support for recurring chores
- [ ] Auto-archive (soft-delete) when end date passes
- [ ] Scheduled job to check end dates daily
- [ ] Handle daily, weekly, bi-weekly, custom schedules
- [ ] Overdue chores stay on original date + shown in today

---

## Phase 6: Dashboard Views
**Estimated time: 5-6 hours**

### 6.1 Main Navigation
- [ ] Create main navigation bar component
- [ ] Navigation items: Dashboard, Points, Activity, Settings (gear icon)
- [ ] Active state indicator
- [ ] Responsive: bottom nav on mobile, sidebar/top on desktop
- [ ] Settings icon triggers admin auth modal

### 6.2 Dashboard Layout
- [ ] Create `/dashboard` page
- [ ] Family member filter bar (horizontal avatar row at top)
- [ ] Toggle filter behavior (multi-select with checkmarks)
- [ ] View switcher (Weekly | Monthly | Daily)
- [ ] Store view preference in localStorage

### 6.3 Weekly View (Default)
- [ ] 7-day calendar grid
- [ ] Show chores on due dates
- [ ] Overdue chores appear in today's column (with red indicator)
- [ ] Navigate weeks (prev/next)

### 6.4 Monthly View
- [ ] Full month calendar grid
- [ ] Show chore counts/previews per day
- [ ] Click date to expand day's chores
- [ ] Navigate months

### 6.5 Daily View
- [ ] Single day focus view
- [ ] List all chores for selected day
- [ ] Include overdue chores from previous days
- [ ] Navigate days

---

## Phase 7: Points & Leaderboard
**Estimated time: 3-4 hours**

### 7.1 Points Page Layout
- [ ] Create `/points` page
- [ ] Leaderboard section
- [ ] Individual member section (click to expand)

### 7.2 Leaderboard
- [ ] Toggle: by points | by tasks completed
- [ ] Show rank, avatar, name, score
- [ ] Time period filter (all time, this month, this week)

### 7.3 Individual Member Stats
- [ ] Click member → expanded view
- [ ] Current balance (points + money value)
- [ ] Total earned (with date range filter)
- [ ] Total redeemed
- [ ] Recent transactions

### 7.4 Redemption (Admin)
- [ ] Redeem button (triggers admin auth)
- [ ] Full redemption only (all points at once)
- [ ] Confirmation modal showing total points and money value
- [ ] Confirm → deduct all points, log transaction

---

## Phase 8: Activity Log
**Estimated time: 2-3 hours**

### 8.1 Activity Page
- [ ] Create `/activity` page
- [ ] Timeline component

### 8.2 Timeline Display
- [ ] Show events chronologically
- [ ] Event types:
  - Chore completed (who, what, points)
  - Points redeemed (who, amount)
- [ ] Family member filter
- [ ] Date range filter

### 8.3 Activity API
- [ ] GET endpoint with pagination
- [ ] Filter parameters

---

## Phase 9: Polish & Testing
**Estimated time: 3-4 hours**

### 9.1 Responsive Design
- [ ] Test all pages on mobile (375px)
- [ ] Test all pages on tablet (768px)
- [ ] Test all pages on desktop (1280px+)
- [ ] Touch target sizes (min 44px)

### 9.2 Error Handling
- [ ] API error responses
- [ ] Toast notifications for actions
- [ ] Form validation messages
- [ ] Empty states

### 9.3 Loading States
- [ ] Skeleton loaders for lists
- [ ] Button loading states
- [ ] Page transitions

### 9.4 Accessibility
- [ ] Keyboard navigation
- [ ] Screen reader labels
- [ ] Color contrast check

---

## Phase 10: Deployment
**Estimated time: 1-2 hours**

### 10.1 Production Build
- [ ] Test production build locally
- [ ] Optimize Docker image size
- [ ] Health check endpoint

### 10.2 Documentation
- [ ] Update README with:
  - Features overview
  - Screenshots
  - Quick start (Docker)
  - Manual setup
  - Environment variables
  - Backup/restore instructions

### 10.3 Release
- [ ] Tag v1.0.0
- [ ] Create GitHub release
- [ ] Publish Docker image (optional)

---

## Summary

| Phase | Description | Est. Time |
|-------|-------------|-----------|
| 1 | Project Foundation | 2-3 hrs |
| 2 | Database Schema | 2-3 hrs |
| 3 | First-Run Setup & Login | 3-4 hrs |
| 4 | Admin Settings | 4-5 hrs |
| 5 | Chore System | 6-7 hrs |
| 6 | Dashboard Views | 5-6 hrs |
| 7 | Points & Leaderboard | 3-4 hrs |
| 8 | Activity Log | 2-3 hrs |
| 9 | Polish & Testing | 3-4 hrs |
| 10 | Deployment | 1-2 hrs |
| **Total** | | **32-41 hrs** |

---

## Future Versions

### v2 — Calendar Integration
- External calendar sync (Google, iCal)
- Full calendar views (monthly, weekly, daily)
- Event management

### v3 — Shopping List
- Add items with autocomplete
- Print to thermal/normal printer
- Share list
