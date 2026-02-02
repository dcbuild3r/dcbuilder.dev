import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Badge variants using CVA (Class Variance Authority) for type-safe styling.
 * Provides consistent badge styles across the application.
 */
const badgeVariants = cva(
	"inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap transition-colors",
	{
		variants: {
			variant: {
				default: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
				hot: "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-[0_0_10px_rgba(251,146,60,0.5)]",
				top: "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-[0_0_10px_rgba(139,92,246,0.5)]",
				new: "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 animate-pulse-new",
				success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
				info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
				warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
				muted: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
			},
			size: {
				sm: "px-1.5 py-0.5 text-xs",
				md: "px-2 py-0.5 text-xs",
				lg: "px-3 py-1 text-sm",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "md",
		},
	}
);

export interface BadgeProps
	extends React.HTMLAttributes<HTMLSpanElement>,
		VariantProps<typeof badgeVariants> {}

/**
 * A versatile badge component for status indicators, tags, and labels.
 */
export function Badge({ className, variant, size, ...props }: BadgeProps) {
	return (
		<span className={cn(badgeVariants({ variant, size }), className)} {...props} />
	);
}

/**
 * Pre-configured badges for common use cases
 */
export function HotBadge({ className, ...props }: Omit<BadgeProps, "variant">) {
	return (
		<Badge variant="hot" className={className} {...props}>
			🔥 HOT
		</Badge>
	);
}

export function TopBadge({ className, ...props }: Omit<BadgeProps, "variant">) {
	return (
		<Badge variant="top" className={className} {...props}>
			✨ TOP
		</Badge>
	);
}

export function NewBadge({ className, ...props }: Omit<BadgeProps, "variant">) {
	return (
		<Badge variant="new" className={className} {...props}>
			NEW
		</Badge>
	);
}

export { badgeVariants };
