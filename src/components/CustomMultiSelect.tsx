"use client";

import { fieldClass } from "@/components/ui/field";
import { useState, useRef, useEffect, useCallback } from "react";

interface Option {
	value: string;
	label: string;
}

interface CustomMultiSelectProps {
	id?: string;
	values: string[];
	onChange: (values: string[]) => void;
	options: Option[];
	placeholder?: string;
	className?: string;
	searchable?: boolean;
}

export function CustomMultiSelect({
	id,
	values,
	onChange,
	options,
	placeholder = "Select...",
	className = "",
	searchable = false,
}: CustomMultiSelectProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [focusedIndex, setFocusedIndex] = useState(-1);
	const [searchQuery, setSearchQuery] = useState("");
	const containerRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const listboxRef = useRef<HTMLDivElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);

	// Filter options based on search query
	const filteredOptions = searchable && searchQuery
		? options.filter((opt) =>
			opt.label.toLowerCase().includes(searchQuery.toLowerCase())
		)
		: options;

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
		setFocusedIndex(0);
		focusDropdown();
	}, [focusDropdown]);

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

	// Toggle a value
	const toggleValue = useCallback((value: string) => {
		if (values.includes(value)) {
			onChange(values.filter((v) => v !== value));
		} else {
			onChange([...values, value]);
		}
	}, [values, onChange]);

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
			case " ":
				e.preventDefault();
				if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
					toggleValue(filteredOptions[focusedIndex].value);
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
	}, [isOpen, focusedIndex, filteredOptions, toggleValue, closeDropdown, openDropdown]);

	// Scroll focused option into view
	useEffect(() => {
		if (isOpen && listboxRef.current && focusedIndex >= 0) {
			const option = listboxRef.current.children[searchable ? focusedIndex + 1 : focusedIndex] as HTMLElement;
			if (option) {
				option.scrollIntoView({ block: "nearest" });
			}
		}
	}, [isOpen, focusedIndex, searchable]);

	// Display text
	const displayText = values.length === 0
		? placeholder
		: values.length === 1
			? options.find((o) => o.value === values[0])?.label || values[0]
			: `${values.length} selected`;

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
				className={`relative w-full flex items-center gap-2 ${fieldClass} ${values.length > 0 ? "pr-16" : "pr-9"}`}
			>
				<span className="min-w-0 flex-1 truncate text-left">{displayText}</span>
				<svg
					className={`absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-transform ${isOpen ? "rotate-180" : ""}`}
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
				</svg>
			</button>
			{values.length > 0 && (
				<button
					type="button"
					onClick={() => onChange([])}
					className="absolute right-9 top-1/2 z-10 -translate-y-1/2 p-0.5 rounded hover:bg-surface-2 cursor-pointer"
					aria-label="Clear selection"
				>
					<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			)}

			{/* Dropdown */}
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
						aria-multiselectable="true"
						aria-activedescendant={focusedIndex >= 0 && id ? `${id}-option-${focusedIndex}` : undefined}
						className="absolute z-[var(--z-dropdown)] mt-1 w-full min-w-[200px] bg-surface text-ink border border-line-strong rounded-xl shadow-lg max-h-[60vh] sm:max-h-60 overflow-y-auto"
					>
						{/* Search input */}
						{searchable && (
							<div className="sticky top-0 p-2 bg-surface border-b border-line">
								<input
									ref={searchInputRef}
									type="text"
									value={searchQuery}
									onChange={(e) => {
										setSearchQuery(e.target.value);
										setFocusedIndex(0);
									}}
									placeholder="Search..."
									className={`w-full ${fieldClass} bg-ground`}
									onClick={(e) => e.stopPropagation()}
								/>
							</div>
						)}
						{filteredOptions.length === 0 ? (
							<div className="px-4 py-3 text-sm text-muted">
								No results found
							</div>
						) : (
							filteredOptions.map((option, index) => {
								const isSelected = values.includes(option.value);
								return (
									<button
										key={option.value}
										id={id ? `${id}-option-${index}` : undefined}
										type="button"
										role="option"
										aria-selected={isSelected}
										onClick={() => toggleValue(option.value)}
										onMouseEnter={() => setFocusedIndex(index)}
										className={`w-full px-4 py-3 sm:px-3 sm:py-2 text-base sm:text-sm text-left transition-colors flex items-center gap-2 ${!searchable ? "first:rounded-t-xl" : ""} last:rounded-b-xl ${
											index === focusedIndex
												? "bg-surface-2/60"
												: "hover:bg-surface-2/60"
										}`}
									>
										{/* Checkbox */}
										<span className={`flex-shrink-0 w-4 h-4 rounded border ${
											isSelected
												? "bg-inverse border-inverse"
												: "border-line-strong"
										} flex items-center justify-center`}>
											{isSelected && (
												<svg className="w-3 h-3 text-inverse-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
													<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
												</svg>
											)}
										</span>
										<span className={isSelected ? "font-medium" : ""}>{option.label}</span>
									</button>
								);
							})
						)}
					</div>
				</>
			)}
		</div>
	);
}
