export const TEST_ID_PREFIX = "test-";

const TEST_PREFIXES = ["test ", "demo ", "qa ", "e2e "];
const TEST_MARKERS = [
  TEST_ID_PREFIX,
  "demo-",
  "qa-",
  "e2e-",
  "@test.example.com",
  "@example.com",
  ".example.com",
  "://example.com",
];

export function isTestLikeValue(value: string | null | undefined) {
  if (!value) return false;

  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;

  return (
    TEST_PREFIXES.some((prefix) => normalized.startsWith(prefix)) ||
    TEST_MARKERS.some((marker) => normalized.includes(marker))
  );
}
