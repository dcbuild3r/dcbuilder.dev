CREATE TABLE "investment_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	"color" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "investment_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "investment_categories_slug_idx" ON "investment_categories" USING btree ("slug");