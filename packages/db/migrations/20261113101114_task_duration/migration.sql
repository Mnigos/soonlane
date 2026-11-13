ALTER TABLE "task" ADD COLUMN "duration_minutes" smallint;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_duration_range" CHECK ("duration_minutes" between 5 and 1440);--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_duration_due_time" CHECK ("duration_minutes" is null or "due_time" is not null);