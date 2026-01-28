"use client";

import { useState, useRef, useEffect } from "react";

interface Option {
	value: string;
	label: string;
}

interface CustomSelectProps {
	id?: string;
	value: string;
	onChange: (value: string) => void;
	options: Option[];
	className?: string;
}

export function CustomSelect({
	id,
	value,
	onChange,
	options,
	className = "",
}: CustomSelectProps) {
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const selectedOption = options.find((opt) => opt.value === value);

	// Close on click outside
	useEffect(() => {
		if (!isOpen) return;

		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [isOpen]);

	// Close on escape
	useEffect(() => {
		if (!isOpen) return;

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") setIsOpen(false);
		};

		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, [isOpen]);

	return (
		<div ref={containerRef} className={`relative ${className}`}>
			{/* Trigger button */}
			<button
				id={id}
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
			>
				<span className="truncate">{selectedOption?.label ?? value}</span>
				<svg
					className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
				</svg>
			</button>

			{/* Dropdown - appears below the trigger */}
			{isOpen && (
				<>
					{/* Backdrop for mobile */}
					<div
						className="sm:hidden fixed inset-0 z-40"
						onClick={() => setIsOpen(false)}
					/>

					{/* Dropdown menu */}
					<div className="absolute z-50 mt-1 w-full min-w-[200px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg max-h-[60vh] sm:max-h-60 overflow-y-auto">
						{options.map((option) => (
							<button
								key={option.value}
								type="button"
								onClick={() => {
									onChange(option.value);
									setIsOpen(false);
								}}
								className={`w-full px-4 py-3 sm:px-3 sm:py-2 text-base sm:text-sm text-left transition-colors first:rounded-t-xl last:rounded-b-xl ${
									option.value === value
										? "bg-neutral-100 dark:bg-neutral-800 font-medium"
										: "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
								}`}
							>
								{option.label}
							</button>
						))}
					</div>
				</>
			)}
		</div>
	);
}
