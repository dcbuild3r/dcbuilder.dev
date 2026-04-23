type ValidationOk<T> = { ok: true; data: T };
type ValidationError = { ok: false; status: 400; error: string };

export function validateEditorialRelevance(
  relevance: unknown,
  fallback?: number,
): ValidationOk<number | undefined> | ValidationError {
  if (relevance === undefined) {
    return { ok: true, data: fallback };
  }

  if (typeof relevance !== "number" || !Number.isInteger(relevance) || relevance < 1 || relevance > 10) {
    return { ok: false, status: 400, error: "relevance must be an integer between 1 and 10" };
  }

  return { ok: true, data: relevance as number };
}
