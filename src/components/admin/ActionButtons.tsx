"use client";

import Image from "next/image";
import { ButtonVariant, BUTTON_VARIANTS } from "@/lib/admin-themes";

// Base action button component
interface ActionButtonProps {
  onClick: () => void;
  variant: ButtonVariant;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
}

export function ActionButton({
  onClick,
  variant,
  children,
  className = "",
  disabled = false,
  "aria-label": ariaLabel,
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap disabled:opacity-50 ${BUTTON_VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

// Pre-configured Edit button
interface EditButtonProps {
  onClick: () => void;
  variant: ButtonVariant;
}

export function EditButton({ onClick, variant }: EditButtonProps) {
  return (
    <ActionButton onClick={onClick} variant={variant} aria-label="Edit item">
      Edit
    </ActionButton>
  );
}

// Pre-configured Delete button (always red)
interface DeleteButtonProps {
  onClick: () => void;
}

export function DeleteButton({ onClick }: DeleteButtonProps) {
  return (
    <ActionButton onClick={onClick} variant="red" aria-label="Delete item">
      Delete
    </ActionButton>
  );
}

// Pre-configured View link button
interface ViewButtonProps {
  href: string;
  variant: ButtonVariant;
}

export function ViewButton({ href, variant }: ViewButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="View item in new tab"
      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${BUTTON_VARIANTS[variant]}`}
    >
      View
    </a>
  );
}

// Star/Featured toggle button
interface StarToggleProps {
  featured: boolean;
  onToggle: () => void;
  label?: string;
}

export function StarToggle({ featured, onToggle, label = "item" }: StarToggleProps) {
  return (
    <button
      onClick={onToggle}
      title={featured ? "Remove star" : `Star this ${label}`}
      aria-label={featured ? `Remove star from ${label}` : `Star this ${label}`}
      aria-pressed={featured}
      className={`p-1.5 rounded-lg transition-colors ${
        featured
          ? "bg-amber-50 text-amber-500 hover:bg-amber-100 dark:bg-amber-500/20 dark:text-amber-400"
          : "bg-white text-neutral-400 border border-neutral-200 hover:border-yellow-300 hover:text-yellow-500 dark:bg-neutral-900 dark:border-neutral-700 dark:hover:border-yellow-500"
      }`}
    >
      <svg
        className="w-4 h-4"
        fill={featured ? "currentColor" : "none"}
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      </svg>
    </button>
  );
}

// Hot toggle button (fire emoji)
interface HotToggleProps {
  hot: boolean;
  onToggle: () => void;
  label?: string;
}

export function HotToggle({ hot, onToggle, label = "item" }: HotToggleProps) {
  return (
    <button
      onClick={onToggle}
      title={hot ? "Remove hot tag" : `Mark ${label} as hot`}
      aria-label={hot ? `Remove hot tag from ${label}` : `Mark ${label} as hot`}
      aria-pressed={hot}
      className={`p-1.5 rounded-lg transition-colors ${
        hot
          ? "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 animate-pulse-hot"
          : "bg-white text-neutral-400 border border-neutral-200 hover:border-red-300 hover:text-red-500 dark:bg-neutral-900 dark:border-neutral-700 dark:hover:border-red-500"
      }`}
    >
      🔥
    </button>
  );
}

// Top toggle button (eye emoji)
interface TopToggleProps {
  top: boolean;
  onToggle: () => void;
  label?: string;
}

export function TopToggle({ top, onToggle, label = "item" }: TopToggleProps) {
  return (
    <button
      onClick={onToggle}
      title={top ? "Remove from top" : `Mark ${label} as top`}
      aria-label={top ? `Remove ${label} from top` : `Mark ${label} as top`}
      aria-pressed={top}
      className={`p-1.5 rounded-lg transition-colors ${
        top
          ? "bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 animate-pulse-top"
          : "bg-white text-neutral-400 border border-neutral-200 hover:border-purple-300 hover:text-purple-500 dark:bg-neutral-900 dark:border-neutral-700 dark:hover:border-purple-500"
      }`}
    >
      👁
    </button>
  );
}

// Table image with placeholder
interface TableImageProps {
  src: string | null | undefined;
  alt: string;
  rounded?: "full" | "default";
}

export function TableImage({ src, alt, rounded = "default" }: TableImageProps) {
  const roundedClass = rounded === "full" ? "rounded-full" : "rounded";

  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        width={32}
        height={32}
        sizes="32px"
        loader={({ src: imageSrc }) => imageSrc}
        unoptimized
        className={`w-8 h-8 ${roundedClass} object-cover`}
      />
    );
  }
  return <div className={`w-8 h-8 ${roundedClass} bg-neutral-200 dark:bg-neutral-700`} aria-hidden="true" />;
}

// Error alert component
interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorAlert({ message, onRetry }: ErrorAlertProps) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg flex items-center justify-between">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1 text-sm font-medium bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800/40 rounded-lg transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}
