"use client";

// Copied from the convergencelabs.xyz landing page (with descent.ts).
import { useEffect, useRef } from "react";
import { drawHero, LABEL_FONT, type Pen, REST_ROT } from "./descent";

const HOLD_MS = 1400;
const SPIN_PER_MS = 0.00009;
const DRAG_PER_PX = 0.008;

function mountFigure(canvas: HTMLCanvasElement) {
	const ctx = canvas.getContext("2d");
	if (!ctx) return () => {};

	const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
	let width = 0;
	let height = 0;
	let dpr = 1;
	let rot = REST_ROT;
	// Animation time only advances while frames are drawn, so nothing jumps after a pause.
	let clock = 0;
	let hold = HOLD_MS;
	let lastFrame = 0;
	let drag: { x: number; rot: number } | null = null;
	let onScreen = false;
	let raf = 0;

	const pen: Pen = {
		line(x1, y1, x2, y2, lineWidth, color, alpha) {
			ctx.beginPath();
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
			ctx.lineWidth = lineWidth;
			ctx.globalAlpha = alpha;
			ctx.strokeStyle = color;
			ctx.stroke();
		},
		dot(x, y, r, color, alpha) {
			ctx.beginPath();
			ctx.arc(x, y, r, 0, Math.PI * 2);
			ctx.globalAlpha = alpha;
			ctx.fillStyle = color;
			ctx.fill();
		},
		text(s, x, y, size, color) {
			ctx.globalAlpha = 1;
			ctx.font = `700 ${size}px ${LABEL_FONT}`;
			ctx.fillStyle = color;
			ctx.shadowColor = "#0b0b0a";
			ctx.shadowBlur = 10;
			ctx.fillText(s, x, y);
			ctx.fillText(s, x, y);
			ctx.shadowBlur = 0;
		},
	};

	const animating = () =>
		!reducedMotion.matches && onScreen && !document.hidden;

	const frame = (now: number) => {
		raf = 0;
		if (!width || !height) return;
		if (animating()) {
			const dt = lastFrame ? Math.min(now - lastFrame, 100) : 0;
			lastFrame = now;
			clock += dt;
			if (!drag) {
				hold -= dt;
				if (hold <= 0) rot += dt * SPIN_PER_MS;
			}
			schedule();
		} else lastFrame = 0;

		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, width, height);
		ctx.lineCap = "round";
		ctx.textBaseline = "top";
		drawHero(pen, {
			w: width,
			h: height,
			rot,
			t: reducedMotion.matches ? null : clock,
		});
	};
	const schedule = () => {
		raf ||= requestAnimationFrame(frame);
	};

	const resize = new ResizeObserver(([entry]) => {
		width = entry.contentRect.width;
		height = entry.contentRect.height;
		dpr = Math.min(window.devicePixelRatio, 2);
		canvas.width = Math.round(width * dpr);
		canvas.height = Math.round(height * dpr);
		schedule();
	});
	resize.observe(canvas);
	const visibility = new IntersectionObserver(([entry]) => {
		onScreen = entry.isIntersecting;
		schedule();
	});
	visibility.observe(canvas);

	const onPointerDown = (event: PointerEvent) => {
		drag = { x: event.clientX, rot };
		canvas.setPointerCapture(event.pointerId);
	};
	const onPointerMove = (event: PointerEvent) => {
		if (!drag) return;
		rot = drag.rot + (event.clientX - drag.x) * DRAG_PER_PX;
		schedule();
	};
	const onPointerEnd = () => {
		drag = null;
		hold = 0;
	};

	const events = new AbortController();
	const { signal } = events;
	canvas.addEventListener("pointerdown", onPointerDown, { signal });
	canvas.addEventListener("pointermove", onPointerMove, { signal });
	canvas.addEventListener("pointerup", onPointerEnd, { signal });
	canvas.addEventListener("pointercancel", onPointerEnd, { signal });
	document.addEventListener("visibilitychange", schedule, { signal });
	reducedMotion.addEventListener("change", schedule, { signal });
	// Labels are drawn in the canvas, so repaint once the mono font arrives.
	document.fonts.ready.then(() => signal.aborted || schedule());

	return () => {
		events.abort();
		resize.disconnect();
		visibility.disconnect();
		cancelAnimationFrame(raf);
	};
}

export function DescentFigure() {
	const canvas = useRef<HTMLCanvasElement>(null);
	useEffect(
		() => (canvas.current ? mountFigure(canvas.current) : undefined),
		[],
	);
	return (
		<canvas
			ref={canvas}
			className="absolute inset-0 size-full cursor-grab touch-pan-y select-none active:cursor-grabbing"
			role="img"
			aria-label="A 3D loss surface with a gradient descent path from where you are to where you want to be"
		/>
	);
}
