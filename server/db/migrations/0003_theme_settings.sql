-- Add theme settings columns to settings table
ALTER TABLE "settings" ADD COLUMN "primary_color" varchar(20) NOT NULL DEFAULT 'indigo';--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "neutral_color" varchar(20) NOT NULL DEFAULT 'slate';--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "radius" decimal(4, 3) NOT NULL DEFAULT '0.25';--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "color_mode" varchar(10) NOT NULL DEFAULT 'system';
