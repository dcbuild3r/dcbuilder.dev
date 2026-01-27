import Image from "next/image";
import Link from "next/link";
import type { MDXComponents } from "mdx/types";

export const mdxComponents: MDXComponents = {
	// Replace img with Next.js optimized Image
	img: (props) => {
		const { src, alt, ...rest } = props as { src?: string; alt?: string };
		if (!src) {
			if (process.env.NODE_ENV === "development") {
				console.warn(
					"[MDXComponents] Image tag missing src attribute. Alt text:",
					alt
				);
			}
			return null;
		}

		// For external images, use regular img
		if (src.startsWith("http")) {
			return (
				// eslint-disable-next-line @next/next/no-img-element
				<img
					src={src}
					alt={alt || ""}
					className="rounded-lg my-6 w-full"
					{...rest}
				/>
			);
		}

		// For local images, use Next.js Image
		return (
			<span className="block my-6">
				<Image
					src={src}
					alt={alt || ""}
					width={800}
					height={450}
					className="rounded-lg w-full h-auto"
				/>
			</span>
		);
	},

	// Style links
	a: ({ href, children, ...props }) => {
		const isExternal = href?.startsWith("http");
		if (isExternal) {
			return (
				<a
					href={href}
					target="_blank"
					rel="noopener noreferrer"
					className="text-blue-600 dark:text-blue-400 hover:underline"
					{...props}
				>
					{children}
				</a>
			);
		}
		return (
			<Link
				href={href || ""}
				className="text-blue-600 dark:text-blue-400 hover:underline"
				{...props}
			>
				{children}
			</Link>
		);
	},

	// Style headings
	h1: ({ children, ...props }) => (
		<h1 className="text-3xl font-bold mt-8 mb-4" {...props}>
			{children}
		</h1>
	),
	h2: ({ children, ...props }) => (
		<h2 className="text-2xl font-bold mt-8 mb-3" {...props}>
			{children}
		</h2>
	),
	h3: ({ children, ...props }) => (
		<h3 className="text-xl font-bold mt-6 mb-2" {...props}>
			{children}
		</h3>
	),

	// Style paragraphs
	p: ({ children, ...props }) => (
		<p className="my-4 leading-relaxed" {...props}>
			{children}
		</p>
	),

	// Style lists
	ul: ({ children, ...props }) => (
		<ul className="my-4 ml-6 list-disc space-y-2" {...props}>
			{children}
		</ul>
	),
	ol: ({ children, ...props }) => (
		<ol className="my-4 ml-6 list-decimal space-y-2" {...props}>
			{children}
		</ol>
	),
	li: ({ children, ...props }) => (
		<li className="leading-relaxed" {...props}>
			{children}
		</li>
	),

	// Style code blocks
	pre: ({ children, ...props }) => (
		<pre
			className="my-6 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-x-auto"
			{...props}
		>
			{children}
		</pre>
	),
	code: ({ children, ...props }) => {
		// Check if inline code (no className from syntax highlighter)
		const isInline = !props.className;
		if (isInline) {
			return (
				<code
					className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-sm"
					{...props}
				>
					{children}
				</code>
			);
		}
		return <code {...props}>{children}</code>;
	},

	// Style blockquotes
	blockquote: ({ children, ...props }) => (
		<blockquote
			className="my-6 pl-4 border-l-4 border-neutral-300 dark:border-neutral-600 italic"
			{...props}
		>
			{children}
		</blockquote>
	),

	// Style horizontal rules
	hr: (props) => (
		<hr
			className="my-8 border-neutral-200 dark:border-neutral-700"
			{...props}
		/>
	),

	// Style strong and emphasis
	strong: ({ children, ...props }) => (
		<strong className="font-bold" {...props}>
			{children}
		</strong>
	),
	em: ({ children, ...props }) => (
		<em className="italic" {...props}>
			{children}
		</em>
	),
};
