CREATE TABLE "activity_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(30) NOT NULL,
	"family_member_id" integer,
	"chore_id" integer,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"color" varchar(7),
	"icon" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "chore_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"chore_id" integer NOT NULL,
	"completed_by" integer NOT NULL,
	"points_earned" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chores" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"points" integer DEFAULT 0 NOT NULL,
	"category_id" integer,
	"assignee_id" integer,
	"is_permanent" boolean DEFAULT false NOT NULL,
	"recurring_type" varchar(20),
	"recurring_config" jsonb,
	"due_date" date,
	"due_time" time,
	"end_date" date,
	"cooldown_type" varchar(20),
	"cooldown_hours" integer,
	"qr_token" varchar(64),
	"nfc_tag_id" varchar(64),
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chores_qr_token_unique" UNIQUE("qr_token"),
	CONSTRAINT "chores_nfc_tag_id_unique" UNIQUE("nfc_tag_id")
);
--> statement-breakpoint
CREATE TABLE "family_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"avatar_type" varchar(20) DEFAULT 'dicebear' NOT NULL,
	"avatar_value" varchar(500) NOT NULL,
	"color" varchar(7) NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"password_hash" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "point_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"family_member_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"type" varchar(20) NOT NULL,
	"description" varchar(200),
	"reference_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"point_value" numeric(10, 2) DEFAULT '1.00' NOT NULL,
	"qr_base_url" varchar(500),
	"primary_color" varchar(20) DEFAULT 'indigo' NOT NULL,
	"neutral_color" varchar(20) DEFAULT 'slate' NOT NULL,
	"radius" numeric(4, 3) DEFAULT '0.25' NOT NULL,
	"color_mode" varchar(10) DEFAULT 'system' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_family_member_id_family_members_id_fk" FOREIGN KEY ("family_member_id") REFERENCES "public"."family_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_chore_id_chores_id_fk" FOREIGN KEY ("chore_id") REFERENCES "public"."chores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_completions" ADD CONSTRAINT "chore_completions_chore_id_chores_id_fk" FOREIGN KEY ("chore_id") REFERENCES "public"."chores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_completions" ADD CONSTRAINT "chore_completions_completed_by_family_members_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."family_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chores" ADD CONSTRAINT "chores_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chores" ADD CONSTRAINT "chores_assignee_id_family_members_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."family_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_family_member_id_family_members_id_fk" FOREIGN KEY ("family_member_id") REFERENCES "public"."family_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_family_member_id_family_members_id_fk" FOREIGN KEY ("family_member_id") REFERENCES "public"."family_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_activity_log_timeline" ON "activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_activity_log_member" ON "activity_log" USING btree ("family_member_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_chore_completions_member" ON "chore_completions" USING btree ("completed_by","completed_at");--> statement-breakpoint
CREATE INDEX "idx_chore_completions_cooldown" ON "chore_completions" USING btree ("chore_id","completed_at");--> statement-breakpoint
CREATE INDEX "idx_chores_due_date" ON "chores" USING btree ("due_date","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_chores_qr_token" ON "chores" USING btree ("qr_token");--> statement-breakpoint
CREATE INDEX "idx_chores_nfc_tag" ON "chores" USING btree ("nfc_tag_id");--> statement-breakpoint
CREATE INDEX "idx_point_transactions_member" ON "point_transactions" USING btree ("family_member_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_user_sessions_token" ON "user_sessions" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX "idx_user_sessions_member" ON "user_sessions" USING btree ("family_member_id");