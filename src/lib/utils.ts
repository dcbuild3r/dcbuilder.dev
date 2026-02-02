import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with proper precedence.
 * Uses clsx for conditional classes and tailwind-merge to resolve conflicts.
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Standard focus ring styles for consistent accessibility.
 */
export const focusRing =
	"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600 focus-visible:ring-offset-2";

/**
 * Standard disabled styles for form elements and buttons.
 */
export const disabledStyles = "disabled:pointer-events-none disabled:opacity-50";
