CREATE TABLE "candidate_redirects" (
	"old_id" text PRIMARY KEY NOT NULL,
	"new_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "candidate_redirects_new_id_idx" ON "candidate_redirects" USING btree ("new_id");