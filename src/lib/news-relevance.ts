type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: 400; error: string };

export function validateEditorialRelevance(
  value: unknown,
  fallback?: number
): ValidationResult<number | undefined> {
  if (value === undefined || value === null || value === "") {
    return { ok: true, data: fallback };
  }

  const relevance = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(relevance) || relevance < 1 || relevance > 10) {
    return {
      ok: false,
      status: 400,
      error: "Relevance must be an integer between 1 and 10",
    };
  }

  return { ok: true, data: relevance };
}
