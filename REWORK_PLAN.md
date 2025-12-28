# FamilyHub Rework Plan: User Auth + QR/NFC

Transform FamilyHub from a shared tablet app to a multi-user system with individual family member logins and QR/NFC-based chore completion via a Capacitor mobile app.

## Overview

- **Tablet/Web**: Shared display interface + admin settings (no user switching)
- **Mobile App**: Per-user login with QR/NFC scanning to complete chores
- **Authentication**: Password-only (no PIN)
- **Session Duration**: 30 days
- **QR/NFC**: Assigned per chore (not per user)

## Phase 1: Database & Auth API

### Schema Changes

- [x] Add `password_hash` column to `family_members` table
- [x] Create `user_sessions` table (family_member_id, session_token, device_name, expires_at, created_at)
- [x] Add `qr_token` (UUID) column to `chores` table
- [x] Add `nfc_tag_id` (string) column to `chores` table
- [x] Create migration to move admin password from `admin` table to admin's `family_members` record
- [x] Drop `admin` table (after migration)

### Auth API Endpoints

- [x] `POST /api/auth/login` — Accept family_member_id + password, return session token
- [x] `POST /api/auth/logout` — Invalidate session token
- [x] `GET /api/auth/me` — Return current user from session
- [x] `GET /api/auth/members` — Return list of family members for login selection
- [x] Add server middleware to validate `Authorization: Bearer <token>` header
- [x] Inject `event.context.user` with authenticated family member

### Cleanup

- [x] Remove `pin_hash` references from schema
- [x] Remove `/api/settings/auth-type.get.ts`
- [x] Simplify `useSettingsAuth.ts` to password-only
- [x] Update `/api/settings/verify.post.ts` to password-only
- [x] Update `/api/settings/security.put.ts` to password-only
- [x] Update `app/pages/settings/security.vue` to password-only
- [x] Update `app/pages/setup.vue` to password-only
- [x] Update `app/layouts/settings.vue` to password-only

## Phase 2: Chore QR/NFC Management

### Backend

- [x] Auto-generate `qr_token` (UUID) when creating chores
- [x] Add `qr_token` to chore creation API
- [x] Add `nfc_tag_id` update endpoint for binding NFC tags
- [ ] Add QR token regeneration endpoint (optional security feature) — *v2*

### Admin UI

- [x] Update `settings/chores.vue` with QR code display (using qrcode library)
- [x] Add print button for individual chore QR codes
- [ ] Add NFC bind/unbind controls in chore edit form — *v2*
- [ ] Show NFC tag status (bound/unbound) in chore list — *v2*

## Phase 3: Scan-to-Complete API

- [x] `POST /api/chores/complete-by-qr` — Accept token query param, use session user
- [x] `POST /api/chores/complete-by-nfc` — Accept tagId query param, use session user
- [x] Reuse existing completion logic (cooldown checks, points, activity log)
- [x] Return chore details in response for mobile UI feedback

## Phase 4: Capacitor Setup

### Project Initialization

- [x] Set `ssr: false` in `nuxt.config.ts`
- [x] Create `capacitor.config.ts`
- [ ] Run `npx cap add ios` (requires Xcode) — *v2*
- [x] Run `npx cap add android` (requires Android Studio)

### Native Plugins

- [x] Install `@capacitor-mlkit/barcode-scanning` for QR
- [x] Install `@capgo/capacitor-nfc` for NFC — *v2: not yet functional*
- [x] Install `@capacitor/haptics` for feedback
- [x] Install `@capacitor/preferences` for session storage
- [x] Configure Android permissions (camera, NFC)
- [ ] Configure iOS permissions (camera, NFC) + capabilities — *v2*

## Phase 5: Mobile App UI

### Login Screen

- [x] Family member selection list (with avatars)
- [x] Password input field
- [x] Login button with loading state
- [x] Error handling (wrong password, network error)
- [x] Store session token in Capacitor Preferences

### Main Scan Screen

- [x] Camera viewfinder for QR scanning
- [x] NFC tap indicator/listener
- [x] Auto-detect scan type (QR vs NFC)
- [x] Call appropriate complete endpoint on scan

### Completion Feedback

- [x] Celebration animation on success
- [x] Haptic feedback
- [x] Show completed chore name and points earned
- [x] Error states (cooldown active, already completed, invalid code)

### Navigation

- [x] Bottom nav: Scan (default), My Chores, Profile
- [x] Profile screen with logout button
- [x] My Chores screen showing assigned chores

## Phase 6: Admin Settings Updates

### Family Member Management

- [x] Add password set/change field per family member
- [x] Show "has password" indicator in member list
- [x] Password strength validation

### Security Settings

- [x] Remove PIN option entirely
- [x] Keep admin password change functionality
- [ ] Add session management (view active sessions, revoke) — *v2*

## Technical Details

### Session Token Format

```
familyhub_<random-32-char-hex>
```

### QR Code Content

```
familyhub://chore/<qr_token>
```

### NFC Tag Storage

Store the NFC tag's UID (unique identifier) as hex string in `nfc_tag_id` column.

### Database Tables

```sql
-- Add to family_members
ALTER TABLE family_members ADD COLUMN password_hash VARCHAR(255);

-- New sessions table
CREATE TABLE user_sessions (
  id SERIAL PRIMARY KEY,
  family_member_id INTEGER NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  device_name VARCHAR(100),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add to chores
ALTER TABLE chores ADD COLUMN qr_token VARCHAR(64) UNIQUE;
ALTER TABLE chores ADD COLUMN nfc_tag_id VARCHAR(64) UNIQUE;
```

## Migration Strategy

1. Deploy schema changes (additive only first)
2. Run data migration (copy admin password to family_members)
3. Deploy new API endpoints
4. Update web UI
5. Build and deploy mobile app
6. Remove deprecated admin table in final cleanup

## Dependencies to Add

```json
{
  "@capacitor/core": "^6.x",
  "@capacitor/cli": "^6.x",
  "@capacitor/ios": "^6.x",
  "@capacitor/android": "^6.x",
  "@capacitor/haptics": "^6.x",
  "@capacitor/preferences": "^6.x",
  "@capawesome/capacitor-mlkit-barcode-scanning": "^6.x",
  "@capgo/capacitor-nfc": "latest",
  "qrcode": "^1.5.x"
}
```
