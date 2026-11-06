CREATE TABLE "label" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_label" (
	"task_id" uuid,
	"label_id" uuid,
	CONSTRAINT "task_label_pkey" PRIMARY KEY("task_id","label_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "label_owner_name_idx" ON "label" ("owner_id",lower("name"));--> statement-breakpoint
CREATE INDEX "task_label_label_idx" ON "task_label" ("label_id");--> statement-breakpoint
ALTER TABLE "label" ADD CONSTRAINT "label_owner_id_user_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "task_label" ADD CONSTRAINT "task_label_task_id_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "task"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "task_label" ADD CONSTRAINT "task_label_label_id_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "label"("id") ON DELETE CASCADE;