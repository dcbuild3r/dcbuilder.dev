"use client";

import { useCallback, useEffect, useRef } from "react";

const FOCUSABLE =
	'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * Escape-to-close, body scroll lock, focus-in/focus-restore and Tab focus trap
 * for a modal surface. Attach `ref` to the dialog element (give it tabIndex={-1})
 * and `onKeyDown` to the same element.
 */
export function useOverlay(open: boolean, onClose: () => void) {
	const ref = useRef<HTMLDivElement>(null);
	const onCloseRef = useRef(onClose);
	useEffect(() => {
		onCloseRef.current = onClose;
	});

	useEffect(() => {
		if (!open) return;
		const previousFocus = document.activeElement as HTMLElement | null;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		ref.current?.focus();

		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onCloseRef.current();
		};
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = previousOverflow;
			previousFocus?.focus?.();
		};
	}, [open]);

	const onKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (e.key !== "Tab") return;
		const focusable = ref.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
		if (!focusable || focusable.length === 0) return;
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		if (e.shiftKey && document.activeElement === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault();
			first.focus();
		}
	}, []);

	return { ref, onKeyDown };
}
