import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Pill/badge variants. Primary set: neutral, outline, accent, warm, solid.
 * Legacy names (default, hot, top, new, featured, success, info, warning, muted) map onto them.
 */
const badgeVariants = cva(
	"inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
	{
		variants: {
			variant: {
				neutral: "bg-surface-2 text-body",
				outline: "border border-line-strong text-body",
				accent: "bg-accent-soft text-accent-ink",
				warm: "bg-warm-soft text-warm",
				solid: "bg-inverse text-inverse-ink",
				default: "bg-surface-2 text-body",
				muted: "bg-surface-2 text-muted",
				hot: "bg-warm-soft text-warm",
				top: "bg-inverse text-inverse-ink",
				new: "border border-line-strong text-body",
				featured: "bg-accent-soft text-accent-ink",
				success: "bg-accent-soft text-accent-ink",
				info: "bg-accent-soft text-accent-ink",
				warning: "bg-warm-soft text-warm",
			},
			size: {
				sm: "px-1.5 py-0.5 text-xs",
				md: "px-2 py-0.5 text-xs",
				lg: "px-3 py-1 text-sm",
			},
		},
		defaultVariants: {
			variant: "neutral",
			size: "md",
		},
	}
);

export interface BadgeProps
	extends React.HTMLAttributes<HTMLSpanElement>,
		VariantProps<typeof badgeVariants> {}

/** Pill for status indicators, tags, and labels. */
export function Badge({ className, variant, size, ...props }: BadgeProps) {
	return (
		<span className={cn(badgeVariants({ variant, size }), className)} {...props} />
	);
}

export { Badge as Pill };

export function HotBadge({ className, ...props }: Omit<BadgeProps, "variant">) {
	return (
		<Badge variant="hot" className={className} {...props}>
			HOT
		</Badge>
	);
}

export function TopBadge({ className, ...props }: Omit<BadgeProps, "variant">) {
	return (
		<Badge variant="top" className={className} {...props}>
			TOP
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
