ALTER TABLE "task" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "depth" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "task_owner_id_key" ON "task" ("owner_id","id");--> statement-breakpoint
CREATE INDEX "task_owner_parent_idx" ON "task" ("owner_id","parent_id");--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_parent_fkey" FOREIGN KEY ("owner_id","parent_id") REFERENCES "task"("owner_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_depth_range" CHECK ("depth" between 0 and 4);--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_parent_depth" CHECK (("parent_id" is null) = ("depth" = 0));