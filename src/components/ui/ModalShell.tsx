"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useOverlay } from "@/hooks/useOverlay";

const CLOSE_MS = 300;

const CloseContext = createContext<() => void>(() => {});

/** Animated close for buttons inside a ModalShell. */
export const useModalClose = () => useContext(CloseContext);

/**
 * Animated modal surface: backdrop click, Escape, scroll lock, focus trap and
 * focus restore. `onClose` fires after the 300ms exit animation. Inner close
 * buttons should call `useModalClose()` to run the same animation.
 */
export function ModalShell({
	open,
	onClose,
	labelledBy,
	describedBy,
	className,
	children,
}: {
	open: boolean;
	onClose: () => void;
	labelledBy: string;
	describedBy?: string;
	className?: string;
	children: React.ReactNode;
}) {
	const [shown, setShown] = useState(false);
	const [closing, setClosing] = useState(false);
	const timer = useRef<number | undefined>(undefined);

	useEffect(() => {
		if (!open) return;
		const id = requestAnimationFrame(() => setShown(true));
		return () => {
			cancelAnimationFrame(id);
			window.clearTimeout(timer.current);
			setShown(false);
			setClosing(false);
		};
	}, [open]);

	const close = useCallback(() => {
		setClosing(true);
		window.clearTimeout(timer.current);
		timer.current = window.setTimeout(onClose, CLOSE_MS);
	}, [onClose]);

	const { ref, onKeyDown } = useOverlay(open, close);

	if (!open) return null;

	return (
		<div
			className={cn(
				"fixed inset-0 z-[var(--z-modal)] flex min-h-screen backdrop-blur-sm transition-colors duration-300 sm:items-center sm:justify-center",
				shown && !closing ? "bg-black/50" : "bg-black/0",
			)}
			onClick={close}
		>
			<div
				ref={ref}
				role="dialog"
				aria-modal="true"
				aria-labelledby={labelledBy}
				aria-describedby={describedBy}
				tabIndex={-1}
				onKeyDown={onKeyDown}
				onClick={(e) => e.stopPropagation()}
				className={cn(
					"fixed inset-0 h-[100dvh] w-full overflow-y-auto bg-surface text-ink shadow-2xl transition-[transform,opacity] duration-300 sm:relative sm:inset-auto sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-2xl sm:border sm:border-line",
					shown && !closing
						? "translate-y-0 ease-out sm:scale-100 sm:opacity-100"
						: "translate-y-full sm:translate-y-0 sm:scale-95 sm:opacity-0",
					className,
				)}
			>
				<CloseContext.Provider value={close}>{children}</CloseContext.Provider>
			</div>
		</div>
	);
}
