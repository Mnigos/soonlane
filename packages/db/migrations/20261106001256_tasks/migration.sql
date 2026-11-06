CREATE TABLE "task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"owner_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"due_date" date NOT NULL,
	"due_time" time(0),
	"priority" smallint DEFAULT 4 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "task_priority_range" CHECK ("priority" between 1 and 4)
);
--> statement-breakpoint
CREATE INDEX "task_owner_due_idx" ON "task" ("owner_id","due_date");--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_owner_id_user_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE CASCADE;