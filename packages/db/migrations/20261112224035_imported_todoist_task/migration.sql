CREATE TABLE "imported_todoist_task" (
	"owner_id" uuid,
	"todoist_id" text,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "imported_todoist_task_pkey" PRIMARY KEY("owner_id","todoist_id")
);
--> statement-breakpoint
ALTER TABLE "imported_todoist_task" ADD CONSTRAINT "imported_todoist_task_owner_id_user_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE CASCADE;