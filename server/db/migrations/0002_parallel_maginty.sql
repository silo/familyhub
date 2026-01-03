ALTER TABLE "settings" ADD COLUMN "screensaver_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "screensaver_timeout" integer DEFAULT 300 NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "screensaver_interval" integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "screensaver_timezone" varchar(50) DEFAULT 'UTC' NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "screensaver_clock_format" varchar(10) DEFAULT 'auto' NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "screensaver_category" varchar(30) DEFAULT 'nature' NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "screensaver_transition" varchar(10) DEFAULT 'fade' NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "screensaver_dim_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "screensaver_dim_start" time DEFAULT '23:00:00';--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "screensaver_dim_end" time DEFAULT '06:00:00';--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "screensaver_dim_opacity" integer DEFAULT 70 NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "unsplash_api_key" varchar(100);--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "weather_api_key" varchar(100);--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "weather_location" varchar(100);--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "weather_units" varchar(10) DEFAULT 'metric' NOT NULL;