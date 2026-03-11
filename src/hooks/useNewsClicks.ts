import { useState, useEffect, useCallback } from "react";

interface UseNewsClicksReturn {
  getClickCount: (id: string) => number;
  isPopular: (id: string) => boolean;
  loaded: boolean;
}

export function useNewsClicks(): UseNewsClicksReturn {
  const [clickCounts, setClickCounts] = useState<Map<string, number>>(new Map());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/hot-news", { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.clickCounts) {
          setClickCounts(new Map(Object.entries(data.clickCounts) as [string, number][]));
        }
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.debug("Failed to fetch news clicks:", error);
        }
      })
      .finally(() => {
        setLoaded(true);
      });

    return () => controller.abort();
  }, []);

  const getClickCount = useCallback(
    (id: string): number => clickCounts.get(id) ?? 0,
    [clickCounts],
  );

  const isPopular = useCallback(
    (id: string): boolean => (clickCounts.get(id) ?? 0) >= 10,
    [clickCounts],
  );

  return { getClickCount, isPopular, loaded };
}
