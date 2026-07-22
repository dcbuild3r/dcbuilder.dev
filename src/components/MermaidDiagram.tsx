"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTheme } from "next-themes";

let mermaidRenderQueue = Promise.resolve();

function queueMermaidRender(
	id: string,
	source: string,
	theme: "default" | "dark"
) {
	const render = async () => {
		const { default: mermaid } = await import("mermaid");
		mermaid.initialize({
			startOnLoad: false,
			securityLevel: "strict",
			theme,
			fontFamily: "var(--font-inter), system-ui, sans-serif",
		});

		return mermaid.render(id, source);
	};

	const result = mermaidRenderQueue.then(render, render);
	mermaidRenderQueue = result.then(
		() => undefined,
		() => undefined
	);

	return result;
}

export function MermaidDiagram({ source }: { source: string }) {
	const reactId = useId();
	const containerRef = useRef<HTMLDivElement>(null);
	const { resolvedTheme } = useTheme();
	const renderKey = `${resolvedTheme === "dark" ? "dark" : "default"}:${source}`;
	const [renderError, setRenderError] = useState<{
		key: string;
		message: string;
	} | null>(null);

	useEffect(() => {
		let active = true;
		const container = containerRef.current;
		const id = `mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

		void queueMermaidRender(
			id,
			source,
			resolvedTheme === "dark" ? "dark" : "default"
		)
			.then(({ svg, bindFunctions }) => {
				if (!active || !container) return;
				container.innerHTML = svg;
				bindFunctions?.(container);
			})
			.catch((renderError: unknown) => {
				if (!active) return;
				setRenderError({
					key: renderKey,
					message:
						renderError instanceof Error
							? renderError.message
							: "Unable to render this diagram.",
				});
			});

		return () => {
			active = false;
			if (container) container.innerHTML = "";
		};
	}, [reactId, renderKey, resolvedTheme, source]);

	if (renderError?.key === renderKey) {
		return (
			<figure className="mermaid-diagram mermaid-diagram-error">
				<figcaption>
					Diagram could not be rendered: {renderError.message}
				</figcaption>
				<pre>
					<code>{source}</code>
				</pre>
			</figure>
		);
	}

	return (
		<figure
			className="mermaid-diagram"
			role="img"
			aria-label="Mermaid diagram"
		>
			<div ref={containerRef} className="mermaid-diagram-canvas" />
		</figure>
	);
}
