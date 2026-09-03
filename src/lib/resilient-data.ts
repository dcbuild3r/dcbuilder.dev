export async function withDataFallback<T>(
  operation: string,
  promise: Promise<T>,
  fallback: T
): Promise<T> {
  const startedAt = Date.now();

  try {
    return await promise;
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        message: "Page data source unavailable",
        operation,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      })
    );
    return fallback;
  }
}
