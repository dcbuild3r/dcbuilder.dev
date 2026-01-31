CREATE TABLE "job_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "job_roles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "job_tags" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	"color" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "job_tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
DROP INDEX "candidates_availability_idx";--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "available" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "investments" ADD COLUMN "categories" text[];--> statement-breakpoint
CREATE INDEX "job_roles_slug_idx" ON "job_roles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "job_tags_slug_idx" ON "job_tags" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "candidates_available_idx" ON "candidates" USING btree ("available");