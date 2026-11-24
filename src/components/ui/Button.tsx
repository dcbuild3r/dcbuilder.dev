import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
	"inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-[18px] text-[14.5px] font-medium whitespace-nowrap transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50",
	{
		variants: {
			variant: {
				primary: "bg-inverse text-inverse-ink",
				secondary: "border border-line-strong bg-surface text-ink",
				accent: "bg-accent text-white",
				ghost: "text-ink hover:bg-surface-2 hover:opacity-100",
			},
			size: {
				md: "",
				sm: "min-h-11 px-4",
				lg: "min-h-12 px-6 text-base",
			},
		},
		defaultVariants: { variant: "primary", size: "md" },
	},
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;

/** Class helper so `<a>` and `<Link>` can look like buttons. */
export function buttonClass(opts: ButtonVariants & { className?: string } = {}) {
	const { className, ...v } = opts;
	return cn(buttonVariants(v), className);
}

export function Button({
	variant,
	size,
	className,
	type = "button",
	...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & ButtonVariants) {
	return <button type={type} className={buttonClass({ variant, size, className })} {...props} />;
}
