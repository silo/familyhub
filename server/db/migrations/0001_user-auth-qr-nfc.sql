-- Migration: Add user authentication (password per family member), sessions, and QR/NFC for chores
-- This migration:
-- 1. Adds password_hash to family_members
-- 2. Creates user_sessions table for mobile app logins
-- 3. Adds qr_token and nfc_tag_id to chores
-- 4. Migrates admin password to the admin family member
-- 5. Drops the admin table

-- Add password_hash column to family_members
ALTER TABLE "family_members" ADD COLUMN "password_hash" varchar(255);

--> statement-breakpoint

-- Create user_sessions table
CREATE TABLE "user_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"family_member_id" integer NOT NULL,
	"session_token" varchar(255) NOT NULL,
	"device_name" varchar(100),
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_sessions_session_token_unique" UNIQUE("session_token")
);

--> statement-breakpoint

-- Add foreign key for user_sessions
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_family_member_id_family_members_id_fk" FOREIGN KEY ("family_member_id") REFERENCES "public"."family_members"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint

-- Create indexes for user_sessions
CREATE INDEX "idx_user_sessions_token" ON "user_sessions" USING btree ("session_token");
CREATE INDEX "idx_user_sessions_member" ON "user_sessions" USING btree ("family_member_id");

--> statement-breakpoint

-- Add QR token and NFC tag ID columns to chores
ALTER TABLE "chores" ADD COLUMN "qr_token" varchar(64);
ALTER TABLE "chores" ADD COLUMN "nfc_tag_id" varchar(64);

--> statement-breakpoint

-- Add unique constraints for QR and NFC
ALTER TABLE "chores" ADD CONSTRAINT "chores_qr_token_unique" UNIQUE("qr_token");
ALTER TABLE "chores" ADD CONSTRAINT "chores_nfc_tag_id_unique" UNIQUE("nfc_tag_id");

--> statement-breakpoint

-- Create indexes for QR and NFC lookups
CREATE INDEX "idx_chores_qr_token" ON "chores" USING btree ("qr_token");
CREATE INDEX "idx_chores_nfc_tag" ON "chores" USING btree ("nfc_tag_id");

--> statement-breakpoint

-- Migrate admin password to the admin family member
UPDATE "family_members" 
SET "password_hash" = (SELECT "password_hash" FROM "admin" LIMIT 1)
WHERE "is_admin" = true;

--> statement-breakpoint

-- Drop the admin table
DROP TABLE "admin";
