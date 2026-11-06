ALTER TABLE "task" ADD COLUMN "repeat_unit" text;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "repeat_interval" smallint;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "repeat_anchor" date;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_repeat_all_or_none" CHECK (num_nulls("repeat_unit", "repeat_interval", "repeat_anchor") in (0, 3));--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_repeat_unit" CHECK ("repeat_unit" in ('day', 'weekday', 'week', 'month', 'year'));--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_repeat_interval_range" CHECK ("repeat_interval" between 1 and 99);--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_repeat_single_interval" CHECK ("repeat_unit" not in ('weekday', 'year') or "repeat_interval" = 1);