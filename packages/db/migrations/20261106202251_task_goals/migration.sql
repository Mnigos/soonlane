ALTER TABLE "task" ADD COLUMN "goal_target" integer;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "goal_unit" text;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "goal_progress" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_goal_target_range" CHECK ("goal_target" between 1 and 10000);--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_goal_progress_range" CHECK ("goal_progress" between 0 and coalesce("goal_target", 0));--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_goal_unit_target" CHECK ("goal_unit" is null or "goal_target" is not null);--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_goal_unit_length" CHECK (char_length("goal_unit") between 1 and 24);