import { cn } from "@/lib/utils";

export function Eyebrow({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
	return (
		<p
			className={cn(
				"font-mono text-[11.5px] font-medium uppercase tracking-[0.16em] text-muted",
				className,
			)}
			{...props}
		/>
	);
}
