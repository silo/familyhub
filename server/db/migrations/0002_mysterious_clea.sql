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
ALTER TABLE "admin" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "admin" CASCADE;--> statement-breakpoint
ALTER TABLE "chores" ADD COLUMN "qr_token" varchar(64);--> statement-breakpoint
ALTER TABLE "chores" ADD COLUMN "nfc_tag_id" varchar(64);--> statement-breakpoint
ALTER TABLE "family_members" ADD COLUMN "password_hash" varchar(255);--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "qr_base_url" varchar(500);--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_family_member_id_family_members_id_fk" FOREIGN KEY ("family_member_id") REFERENCES "public"."family_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_user_sessions_token" ON "user_sessions" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX "idx_user_sessions_member" ON "user_sessions" USING btree ("family_member_id");--> statement-breakpoint
CREATE INDEX "idx_chores_qr_token" ON "chores" USING btree ("qr_token");--> statement-breakpoint
CREATE INDEX "idx_chores_nfc_tag" ON "chores" USING btree ("nfc_tag_id");--> statement-breakpoint
ALTER TABLE "chores" ADD CONSTRAINT "chores_qr_token_unique" UNIQUE("qr_token");--> statement-breakpoint
ALTER TABLE "chores" ADD CONSTRAINT "chores_nfc_tag_id_unique" UNIQUE("nfc_tag_id");