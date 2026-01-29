"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  field: string;
  placeholder?: string;
  className?: string;
}

export function Combobox({
  value,
  onChange,
  field,
  placeholder,
  className = "",
}: ComboboxProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const fetchSuggestions = useCallback(
    async (query: string) => {
      try {
        const res = await fetch(
          `/api/v1/autocomplete?field=${field}&q=${encodeURIComponent(query)}`
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
      }
    },
    [field]
  );

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (value.length >= 0) {
        fetchSuggestions(value);
      }
    }, 150);

    return () => clearTimeout(debounceTimeout);
  }, [value, fetchSuggestions]);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        return;
      }
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex]);

  const filteredSuggestions = suggestions.filter(
    (s) => s.toLowerCase() !== value.toLowerCase()
  );

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
          setHighlightedIndex(-1);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          // Delay to allow click on suggestion
          setTimeout(() => setIsOpen(false), 150);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 ${className}`}
      />
      {isOpen && filteredSuggestions.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-1 max-h-48 overflow-auto bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <li
              key={suggestion}
              onMouseDown={() => handleSelect(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`px-3 py-2 cursor-pointer text-sm ${
                index === highlightedIndex
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "hover:bg-neutral-50 dark:hover:bg-neutral-700"
              }`}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Multi-value combobox for tags/skills
interface MultiComboboxProps {
  value: string;
  onChange: (value: string) => void;
  field: string;
  placeholder?: string;
  className?: string;
}

export function MultiCombobox({
  value,
  onChange,
  field,
  placeholder,
  className = "",
}: MultiComboboxProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [currentInput, setCurrentInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Parse existing values
  const existingValues = value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  const lastCommaIndex = value.lastIndexOf(",");
  const currentTyping =
    lastCommaIndex >= 0 ? value.slice(lastCommaIndex + 1).trim() : value.trim();

  const fetchSuggestions = useCallback(
    async (query: string) => {
      try {
        const res = await fetch(
          `/api/v1/autocomplete?field=${field}&q=${encodeURIComponent(query)}`
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
      }
    },
    [field]
  );

  useEffect(() => {
    setCurrentInput(currentTyping);
    const debounceTimeout = setTimeout(() => {
      fetchSuggestions(currentTyping);
    }, 150);

    return () => clearTimeout(debounceTimeout);
  }, [currentTyping, fetchSuggestions]);

  const handleSelect = (selectedValue: string) => {
    // Replace the current typing portion with the selected value
    const prefix =
      lastCommaIndex >= 0 ? value.slice(0, lastCommaIndex + 1) + " " : "";
    onChange(prefix + selectedValue + ", ");
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && filteredSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        setIsOpen(true);
        return;
      }
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredSuggestions[highlightedIndex]) {
          handleSelect(filteredSuggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex]);

  // Filter out already selected values and current typing match
  const filteredSuggestions = suggestions.filter(
    (s) =>
      !existingValues.some(
        (v) => v.toLowerCase() === s.toLowerCase()
      ) && s.toLowerCase() !== currentTyping.toLowerCase()
  );

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
          setHighlightedIndex(-1);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          setTimeout(() => setIsOpen(false), 150);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 ${className}`}
      />
      {isOpen && filteredSuggestions.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-1 max-h-48 overflow-auto bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <li
              key={suggestion}
              onMouseDown={() => handleSelect(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`px-3 py-2 cursor-pointer text-sm ${
                index === highlightedIndex
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "hover:bg-neutral-50 dark:hover:bg-neutral-700"
              }`}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
