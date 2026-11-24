CREATE TABLE "linear_pin" (
	"task_id" uuid,
	"issue_id" text,
	"identifier" text NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"pinned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "linear_pin_pkey" PRIMARY KEY("task_id","issue_id")
);
--> statement-breakpoint
ALTER TABLE "linear_pin" ADD CONSTRAINT "linear_pin_task_id_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "task"("id") ON DELETE CASCADE;