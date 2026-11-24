import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return <div className={cn("rounded-2xl border border-line bg-surface", className)} {...props} />;
}

/** One bordered rounded container; direct children get `border-b border-line` separators. */
export function CardList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"overflow-hidden rounded-2xl border border-line bg-surface [&>*:not(:last-child)]:border-b [&>*:not(:last-child)]:border-line",
				className,
			)}
			{...props}
		/>
	);
}
