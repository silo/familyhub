# FamilyHub — AI Agent Context

This document provides context for AI coding agents working on this project.

## Project Overview

**FamilyHub** is a self-hosted family chore management application designed to run on a shared family tablet. It features chore tracking, a points/rewards system, and activity logging.

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Nuxt | 4.x | Full-stack Vue framework |
| Vue | 3.5+ | Frontend framework |
| TypeScript | Latest | Type safety |
| NuxtUI | 4.x | UI component library |
| Drizzle ORM | Latest | Database ORM |
| Zod | Latest | Schema validation |
| PostgreSQL | 16+ | Database |
| Docker | Latest | Containerization |
| DiceBear | Latest | Avatar generation (`personas` style) |

## Project Structure

```
familyhub/
├── app/
│   ├── components/         # Vue components
│   │   ├── chore/          # Chore-related components
│   │   ├── family/         # Family member components
│   │   ├── dashboard/      # Dashboard view components
│   │   └── ui/             # Shared UI components
│   ├── composables/        # Vue composables
│   ├── layouts/            # Page layouts
│   ├── pages/              # File-based routing
│   │   ├── index.vue       # Redirects to /dashboard
│   │   ├── dashboard.vue   # Main dashboard
│   │   ├── points.vue      # Points/leaderboard
│   │   ├── activity.vue    # Activity log
│   │   ├── setup.vue       # First-run setup
│   │   └── settings/       # Admin settings (nested routes)
│   ├── middleware/         # Route middleware
│   └── app.vue             # Root component
├── server/
│   ├── api/                # API routes
│   │   ├── chores/         # Chore CRUD
│   │   ├── family/         # Family member CRUD
│   │   ├── points/         # Points management
│   │   ├── activity/       # Activity log
│   │   ├── settings/       # Admin settings
│   │   └── backup/         # Backup/restore
│   ├── db/
│   │   ├── index.ts        # Drizzle client
│   │   ├── schema.ts       # Database schema
│   │   └── migrations/     # SQL migrations
│   ├── utils/              # Server utilities
│   └── middleware/         # Server middleware
├── public/
│   └── uploads/            # User-uploaded images
├── docker-compose.yml      # PostgreSQL + App
├── Dockerfile              # Production build
├── drizzle.config.ts       # Drizzle configuration
├── nuxt.config.ts          # Nuxt configuration
└── package.json
```

## Key Concepts

### Authentication Model
- **Single admin login** (password OR 4-digit PIN)
- **No sessions** — password/PIN required each time entering settings
- **1-minute inactivity timeout** in settings area
- Admin is also a family member (the first one created)

### Chore Types
1. **One-time**: Soft-deleted after completion (preserved for history)
2. **Permanent**: Always visible, can be completed repeatedly
   - Cooldown options: unlimited, daily, or X hours
3. **Recurring**: Shows on scheduled days with optional end date
   - Auto-archives when end date passes

### Chore Assignment
- **Assigned**: Bound to specific family member
- **Unassigned**: Anyone can complete; modal asks who did it

### Points Flow
1. Chore completed → Points credited to family member
2. Celebration animation + toast notification with undo
3. Family member requests redemption from admin
4. Admin processes full redemption (all points, manual money transfer)
5. Transaction logged in history

## Database Schema Overview

See `DATABASE.md` for full schema. Key tables:
- `admin` — Password/PIN hash, settings
- `family_members` — Name, avatar, color, isAdmin flag
- `categories` — Optional chore grouping (starts empty)
- `chores` — Chore definitions with recurring config, cooldown, soft-delete
- `chore_completions` — Completion records with points earned
- `point_transactions` — Points earned/redeemed
- `activity_log` — Timeline events

**Key conventions:**
- All timestamps stored in UTC
- Soft-delete via `deleted_at` column
- Default currency: USD (configurable)
- Recurring chores use `recurring_config` JSON (no separate instances table)
- Version read from `package.json`

## Coding Conventions

### TypeScript
- Strict mode enabled
- Use Zod for all API input validation
- Define types in `types/` directory

### Vue/Nuxt
- Use `<script setup lang="ts">` for all components
- Prefer composables for shared logic
- Use NuxtUI components (UButton, UCard, UModal, etc.)

### API Routes
- Use Nuxt server routes (`server/api/`)
- Validate with Zod schemas
- Return consistent response format:
  ```ts
  { data: T } | { error: string }
  ```

### Database
- Use Drizzle ORM for all queries
- Migrations in `server/db/migrations/`
- Schema in `server/db/schema.ts`

### Styling
- Use Tailwind CSS (via NuxtUI)
- Pastel color palette for family member colors
- Mobile-first responsive design

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/familyhub

# App
NUXT_PUBLIC_APP_NAME=FamilyHub
```

## Common Tasks

### Add a new API endpoint
1. Create file in `server/api/[resource]/[action].ts`
2. Define Zod schema for input validation
3. Implement handler with Drizzle queries
4. Add types to `types/` if needed

### Add a new page
1. Create file in `app/pages/[route].vue`
2. Add to navigation if needed
3. Implement middleware for auth if required

### Add a new component
1. Create in `app/components/[category]/[Name].vue`
2. Use NuxtUI primitives where possible
3. Accept props with TypeScript interfaces

## Related Documentation
- `PLAN.md` — Feature specifications
- `DEVELOPMENT.md` — Development roadmap and phases
- `DATABASE.md` — Full database schema
