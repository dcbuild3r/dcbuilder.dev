export async function withDataFallback<T>(
  operation: string,
  promise: Promise<T>,
  fallback: T,
  options: { timeoutMs?: number } = {}
): Promise<T> {
  const startedAt = Date.now();
  const timeoutMs = options.timeoutMs ?? 2_500;
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          const error = new Error(
            `Data source timed out after ${timeoutMs}ms`
          ) as Error & { code?: string };
          error.code = "ETIMEDOUT";
          reject(error);
        }, timeoutMs);
      }),
    ]);
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
  } finally {
    if (timer) clearTimeout(timer);
  }
}
