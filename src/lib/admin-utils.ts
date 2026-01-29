// Shared admin utilities

/**
 * Get the admin API key from localStorage
 */
export function getAdminApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("admin_api_key") ?? "";
}

/**
 * Result type for admin fetch operations
 */
export interface FetchResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Fetch wrapper with proper error handling for admin pages
 * - Checks response status before parsing JSON
 * - Returns structured result with error messages
 * - Handles network errors gracefully
 */
export async function adminFetch<T>(
  url: string,
  options?: RequestInit
): Promise<FetchResult<T>> {
  try {
    const res = await fetch(url, options);

    if (!res.ok) {
      // Try to get error message from response body
      const errorBody = await res.json().catch(() => ({}));
      const errorMessage = errorBody.error || `Request failed: ${res.status} ${res.statusText}`;

      // Special handling for auth errors
      if (res.status === 401) {
        return { data: null, error: "Invalid or missing API key" };
      }
      if (res.status === 403) {
        return { data: null, error: "Access denied" };
      }

      return { data: null, error: errorMessage };
    }

    const json = await res.json();
    return { data: json.data ?? json, error: null };
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    return {
      data: null,
      error: "Network error. Please check your connection and try again.",
    };
  }
}

/**
 * Minimum loading delay to prevent jarring quick flashes
 * Returns both the result and any error that occurred
 */
export const MIN_LOADING_DELAY = 800;

export async function withMinDelay<T>(
  promise: Promise<T>,
  minDelay: number = MIN_LOADING_DELAY
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await promise;
    const elapsed = Date.now() - startTime;
    const remaining = minDelay - elapsed;

    if (remaining > 0) {
      await new Promise(resolve => setTimeout(resolve, remaining));
    }

    return result;
  } catch (error) {
    // Still wait for minimum delay even on error for consistent UX
    const elapsed = Date.now() - startTime;
    const remaining = minDelay - elapsed;

    if (remaining > 0) {
      await new Promise(resolve => setTimeout(resolve, remaining));
    }

    throw error;
  }
}
