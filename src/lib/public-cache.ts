import { unstable_cache } from "next/cache";

// Public pages can tolerate a short amount of staleness, while a shared data
// cache avoids reconnecting to Postgres and rebuilding the same view models on
// every request. Admin writes are reflected on the next revalidation window.
export const PUBLIC_DATA_REVALIDATE_SECONDS = 60;

type AsyncLoader<Args extends unknown[], Result> = (...args: Args) => Promise<Result>;

export function cachePublicData<Args extends unknown[], Result>(
  keyParts: readonly string[],
  loader: AsyncLoader<Args, Result>,
  tags: readonly string[] = [],
  revalidate = PUBLIC_DATA_REVALIDATE_SECONDS,
): AsyncLoader<Args, Result> {
  // `unstable_cache` needs Next's request-scoped incremental cache, which is
  // not present when the Bun unit tests call data loaders directly.
  if (process.env.NODE_ENV === "test") {
    return loader;
  }

  return unstable_cache(loader, ["public-data", ...keyParts], {
    revalidate,
    tags: [...tags],
  });
}
