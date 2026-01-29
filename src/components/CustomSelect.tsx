"use client";

import { useState, useRef, useEffect, useCallback } from "react";

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
	searchable?: boolean;
}

export function CustomSelect({
	id,
	value,
	onChange,
	options,
	className = "",
	searchable = false,
}: CustomSelectProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [focusedIndex, setFocusedIndex] = useState(-1);
	const [searchQuery, setSearchQuery] = useState("");
	const containerRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const listboxRef = useRef<HTMLDivElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);

	const selectedOption = options.find((opt) => opt.value === value);

	// Filter options based on search query
	const filteredOptions = searchable && searchQuery
		? options.filter((opt) =>
			opt.label.toLowerCase().includes(searchQuery.toLowerCase())
		)
		: options;

	const selectedIndex = filteredOptions.findIndex((opt) => opt.value === value);

	const focusDropdown = useCallback(() => {
		window.setTimeout(() => {
			if (searchable) {
				searchInputRef.current?.focus();
			} else {
				listboxRef.current?.focus();
			}
		}, 0);
	}, [searchable]);

	const openDropdown = useCallback(() => {
		setIsOpen(true);
		setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0);
		focusDropdown();
	}, [focusDropdown, selectedIndex]);

	const closeDropdown = useCallback(() => {
		setIsOpen(false);
		setSearchQuery("");
		setFocusedIndex(-1);
	}, []);

	// Close on click outside
	useEffect(() => {
		if (!isOpen) return;

		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				closeDropdown();
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [isOpen, closeDropdown]);

	// Handle keyboard navigation
	const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (!isOpen) {
			if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp") {
				e.preventDefault();
				openDropdown();
			}
			return;
		}

		switch (e.key) {
			case "Escape":
				e.preventDefault();
				closeDropdown();
				triggerRef.current?.focus();
				break;
			case "Tab":
				closeDropdown();
				break;
			case "ArrowDown":
				e.preventDefault();
				setFocusedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
				break;
			case "ArrowUp":
				e.preventDefault();
				setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
				break;
			case "Enter":
				e.preventDefault();
				if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
					onChange(filteredOptions[focusedIndex].value);
					closeDropdown();
					triggerRef.current?.focus();
				}
				break;
			case "Home":
				e.preventDefault();
				setFocusedIndex(0);
				break;
			case "End":
				e.preventDefault();
				setFocusedIndex(filteredOptions.length - 1);
				break;
		}
	}, [isOpen, focusedIndex, filteredOptions, onChange, closeDropdown, openDropdown]);

	// Scroll focused option into view
	useEffect(() => {
		if (isOpen && listboxRef.current && focusedIndex >= 0) {
			const option = listboxRef.current.children[searchable ? focusedIndex + 1 : focusedIndex] as HTMLElement;
			if (option) {
				option.scrollIntoView({ block: "nearest" });
			}
		}
	}, [isOpen, focusedIndex, searchable]);

	return (
			<div ref={containerRef} className={`relative ${className}`} onKeyDown={handleKeyDown}>
				{/* Trigger button */}
				<button
					id={id}
					type="button"
					ref={triggerRef}
					onClick={() => {
						if (isOpen) {
							closeDropdown();
						} else {
							openDropdown();
						}
					}}
					aria-haspopup="listbox"
					aria-expanded={isOpen}
					aria-controls={id ? `${id}-listbox` : undefined}
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
							className="sm:hidden fixed inset-0 z-[var(--z-sticky)]"
							onClick={closeDropdown}
						/>

					{/* Dropdown menu */}
					<div
						ref={listboxRef}
						id={id ? `${id}-listbox` : undefined}
						role="listbox"
						tabIndex={searchable ? undefined : -1}
						aria-labelledby={id}
						aria-activedescendant={focusedIndex >= 0 && id ? `${id}-option-${focusedIndex}` : undefined}
						className="absolute z-[var(--z-dropdown)] mt-1 w-full min-w-[200px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg max-h-[60vh] sm:max-h-60 overflow-y-auto"
					>
						{/* Search input */}
						{searchable && (
							<div className="sticky top-0 p-2 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
								<input
									ref={searchInputRef}
									type="text"
									value={searchQuery}
									onChange={(e) => {
										setSearchQuery(e.target.value);
										setFocusedIndex(0);
									}}
									placeholder="Search..."
									className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
									onClick={(e) => e.stopPropagation()}
								/>
							</div>
						)}
						{filteredOptions.length === 0 ? (
							<div className="px-4 py-3 text-sm text-neutral-500">
								No results found
							</div>
						) : (
							filteredOptions.map((option, index) => (
								<button
									key={option.value}
									id={id ? `${id}-option-${index}` : undefined}
									type="button"
									role="option"
									aria-selected={option.value === value}
									onClick={() => {
										onChange(option.value);
										closeDropdown();
									}}
									onMouseEnter={() => setFocusedIndex(index)}
									className={`w-full px-4 py-3 sm:px-3 sm:py-2 text-base sm:text-sm text-left transition-colors ${!searchable ? "first:rounded-t-xl" : ""} last:rounded-b-xl ${
										option.value === value
											? "bg-neutral-100 dark:bg-neutral-800 font-medium"
											: index === focusedIndex
												? "bg-neutral-50 dark:bg-neutral-800/50"
												: "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
									}`}
								>
									{option.label}
								</button>
							))
						)}
					</div>
				</>
			)}
		</div>
	);
}
