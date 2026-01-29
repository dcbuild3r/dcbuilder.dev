"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

interface ImageModalProps {
  url: string;
  onClose: () => void;
}

function ImageModal({ url, onClose }: ImageModalProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Pre-load image to check if it works
  useEffect(() => {
    setStatus("loading");
    const img = new window.Image();
    img.onload = () => setStatus("loaded");
    img.onerror = () => setStatus("error");
    img.src = url;
  }, [url]);

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-neutral-900 rounded-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image container */}
        <div className="p-4 min-w-[300px] min-h-[200px] flex items-center justify-center">
          {status === "loading" && (
            <div className="w-64 h-64 bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-neutral-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}

          {status === "error" && (
            <div className="w-80 flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-6">
              <svg className="w-12 h-12 text-red-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-red-600 dark:text-red-400 font-medium mb-2">Failed to load image</p>
              <p className="text-red-500/70 dark:text-red-400/70 text-xs text-center break-all">{url}</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 text-blue-600 hover:text-blue-700 text-sm underline"
              >
                Open URL directly
              </a>
            </div>
          )}

          {status === "loaded" && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={url}
              alt="Preview"
              className="max-w-full max-h-[75vh] object-contain rounded-lg"
            />
          )}
        </div>

        {/* URL display */}
        <div className="px-4 pb-4 flex items-center gap-2">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 break-all flex-1">{url}</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 text-xs whitespace-nowrap"
          >
            Open in new tab
          </a>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}

interface ImageInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  folder?: string; // Subfolder in R2 bucket (e.g., "companies", "candidates")
}

export function ImageInput({
  label,
  value,
  onChange,
  placeholder = "https://example.com/image.png",
  required = false,
  folder = "uploads",
}: ImageInputProps) {
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasUrl = value && value.trim() !== "";

  const getApiKey = useCallback(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("admin_api_key") || "";
    }
    return "";
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "x-api-key": getApiKey(),
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      onChange(data.url);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label}
        {required && " *"}
      </label>
      <div className="flex flex-col gap-2">
        {/* URL input row */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
          />
          <button
            type="button"
            onClick={() => {
              if (hasUrl) {
                setShowModal(true);
              }
            }}
            disabled={!hasUrl}
            className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
              hasUrl
                ? "bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400"
                : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-600 cursor-not-allowed"
            }`}
          >
            Preview
          </button>
        </div>

        {/* Upload button row */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
            onChange={handleFileSelect}
            className="hidden"
            id={`upload-${label.replace(/\s+/g, "-").toLowerCase()}`}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
              uploading
                ? "bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-600 cursor-not-allowed"
                : "bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-400"
            }`}
          >
            {uploading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload Image
              </>
            )}
          </button>
          <span className="text-xs text-neutral-500">Max 5MB · JPG, PNG, GIF, WebP, SVG</span>
        </div>

        {/* Error message */}
        {uploadError && (
          <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>
        )}
      </div>

      {showModal && hasUrl && (
        <ImageModal url={value} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

export function ImagePreview({ url }: { url: string }) {
  const [showModal, setShowModal] = useState(false);

  if (!url || url.trim() === "") return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="text-blue-600 hover:text-blue-700 text-sm underline"
      >
        Preview
      </button>
      {showModal && <ImageModal url={url} onClose={() => setShowModal(false)} />}
    </>
  );
}
