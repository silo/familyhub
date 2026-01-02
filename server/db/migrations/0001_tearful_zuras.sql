CREATE TABLE "chore_assignees" (
	"id" serial PRIMARY KEY NOT NULL,
	"chore_id" integer NOT NULL,
	"family_member_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chore_assignees" ADD CONSTRAINT "chore_assignees_chore_id_chores_id_fk" FOREIGN KEY ("chore_id") REFERENCES "public"."chores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_assignees" ADD CONSTRAINT "chore_assignees_family_member_id_family_members_id_fk" FOREIGN KEY ("family_member_id") REFERENCES "public"."family_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_chore_assignees_chore" ON "chore_assignees" USING btree ("chore_id");--> statement-breakpoint
CREATE INDEX "idx_chore_assignees_member" ON "chore_assignees" USING btree ("family_member_id");