/**
 * Investment type definitions
 * Data is fetched from the database - see src/db/schema/investments.ts
 */

export interface Investment {
	title: string;
	description: string;
	imageUrl: string;
	logo: string;
	tier: 1 | 2 | 3 | 4;
	featured: boolean;
	status?: "active" | "inactive" | "acquired";
	x?: string;
	github?: string;
}
