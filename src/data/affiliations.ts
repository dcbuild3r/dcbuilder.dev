/**
 * Affiliation type definitions
 * Data is fetched from the database - see src/db/schema/misc.ts
 */

export interface Affiliation {
	title: string;
	role: string;
	dateBegin: string;
	dateEnd: string;
	description: string;
	imageUrl: string;
	logo: string;
}
