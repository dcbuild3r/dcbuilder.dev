const TOLERANCE_SECONDS = 5 * 60;

/** Svix sends unix seconds; reject anything outside ±5 minutes so captured requests can't be replayed. */
export function isFreshWebhookTimestamp(timestamp: string, nowMs = Date.now()): boolean {
  if (!/^\d+$/.test(timestamp)) return false;
  return Math.abs(nowMs / 1000 - Number(timestamp)) <= TOLERANCE_SECONDS;
}
