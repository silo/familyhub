# FamilyHub

A self-hosted family chore management app built with Nuxt 4, NuxtUI 4, Drizzle ORM, and PostgreSQL. Designed for shared family tablets with an intuitive interface for all ages.

---

## Chore (v1)

### Overview

Family chore management with points/rewards system. Single admin login, multiple family members, shared tablet-friendly design.

### Features

#### First-Run Setup
- Detects empty database → redirects to `/setup`
- Admin creates password OR 4-digit PIN
- Admin is automatically created as the first family member
- Optionally create additional family members (can skip, add later)
- After setup → redirect to dashboard

#### Family Members
- **Avatar**: DiceBear integration using `personas` style OR custom image upload (stored locally in `/uploads`)
- **Color**: 12 pastel colors that complement NuxtUI theme
- **No limit** on number of family members
- Admin is always a family member (cannot be deleted)
- **Deletion**: Hard delete with confirmation modal ("Are you sure? All data will be lost for this family member")

#### Chores
- **Title, description** (optional), **points** (optional), **category** (optional)
- **Assignment**:
  - Assigned to specific family member, OR
  - Unassigned/open (any family member can complete)
- **Due date/time**: Optional
- **End date**: Optional — recurring chores auto-archive when end date passes
- **Recurring types**:
  - Daily
  - Weekly (specific day)
  - Bi-weekly (specific day)
  - Custom (every X days, or specific days like Mon/Thu)
- **Permanent vs One-time**:
  - **Permanent**: Always visible, can be completed repeatedly
    - Cooldown options: Unlimited, Once per day (resets midnight), Once per X hours
    - When on cooldown: grayed out/disabled until available
  - **One-time**: Soft-deleted after completion (preserved for history/activity log)
- **Overdue behavior**: 
  - Stays on original date with red indicator
  - Also highlighted/shown in today's view
  - Remains until marked done
- **Completion flow**:
  - Anyone can mark any chore as done (shared tablet)
  - For unassigned chores: modal appears to select which family member completed it
  - For assigned chores: completes immediately (no confirmation dialog)
  - **Celebration**: Party horn animation plays on every completion
  - **Toast notification**: Bottom-right stacked toast showing "You completed X task" with 5-second undo button
  - Points awarded to the completing family member

#### Categories
- Optional grouping for chores (e.g., "Kitchen", "Bathroom", "Garden")
- **No default categories** — starts empty, admin creates as needed
- Admin creates/manages categories in settings

#### Points System
- Points earned from completing chores
- **Point value**: Admin sets currency (default: USD) and money value per point
- **Display**: Points shown everywhere, money value in parentheses on Points page
- **Redemption**: 
  - Admin-only action (family member asks admin to redeem)
  - **Full redemption only** — all points redeemed at once
  - Manual money transfer (not automated)
  - Transaction logged with timestamp
- **History**: 
  - All transactions preserved forever (earned + redeemed)
  - Filter by date range (year, month, custom)
  - View total earned, total redeemed, current balance

#### Activity Log
- Timeline view of:
  - Chore completions (who, what, when, points earned)
  - Point redemptions (who, amount, when)
  - Soft-deleted chores appear in timeline/history
- Filterable by family member and date range

#### Dashboard Views
- **Family filter bar**: Horizontal row of family member avatars at top
  - **Toggle behavior**: Click to select/deselect, can select multiple
  - **Checkmark indicator** on selected avatars
  - Can view: all members, some members, or one member
- **Default view**: Weekly calendar
- **View options**:
  - **Weekly** (default): 7-day view
  - **Monthly**: Full month grid
  - **Daily**: Single day focus
- **Today's chores**: Overdue chores from previous days also shown in today's column

#### Admin Settings (Password/PIN Protected)
- **Access**: Requires password or 4-digit PIN every time
- **Timeout**: 1 minute inactivity → re-enter password/PIN
- **Manage**:
  - Family members (CRUD)
  - Chores (CRUD)
  - Categories (CRUD)
  - Point value configuration (currency + value)
  - Change password/PIN
- **Backup**: Download `.sql` dump
- **Restore**: Upload `.sql` file (overwrites everything)
- **Version**: Displayed in footer of admin settings page

#### Login Page
- App name "FamilyHub"
- Version number
- Welcome message
- Password/PIN entry field

#### Navigation Structure
```
/dashboard      - Main view (weekly/monthly/daily) with family filter
/points         - Leaderboard + individual member stats
/activity       - Timeline log
/settings       - Admin-only (password protected)
  /settings/family-members
  /settings/chores
  /settings/categories
  /settings/points-config
  /settings/backup
  /settings/security
/setup          - First-run only
```

#### Timezone
- Uses **UTC** internally for all date/time storage
- Converts to browser timezone for display (safest approach)

#### Responsive Design
- Mobile, tablet, and desktop support
- Touch-friendly buttons for tablet use
- Larger tap targets for family members (especially children)

## Calendar (v2)

### Brainstorm

- Dashboard with full calendar
- Every family member  is on top of the page and calendar can be filtered when clicking on family user icon
- Sync calendar with google, ical, and other calendars that is assigned to family members, so they bounded to a family member, so we can filter when on Calendar Dashboard
    - When importing a sync. calendar, admin can name it so we can use it later
- Admin can set a timer how often the calendar should sync
- Calendar view
    - Monthly
    - Weekly
    - Daily
- 

## Shopping List (v3)

- Add to list
- When adding again, autocomplete what added before
- Print the list to an thermal printer og normal printer
- 

## **Tech Stack**

Self hosted friendly

- Nuxt 4.x
- Typescript
- Docker
- PostgreSQL
- NuxtUI 4 ( [https://ui.nuxt.com](https://ui.nuxt.com/) )