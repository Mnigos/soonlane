CREATE TABLE "calendar_subscription" (
	"owner_id" uuid PRIMARY KEY,
	"token_hash" text NOT NULL UNIQUE,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "calendar_subscription" ADD CONSTRAINT "calendar_subscription_owner_id_user_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE CASCADE;