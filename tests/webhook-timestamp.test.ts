import { describe, expect, test } from "bun:test";
import { isFreshWebhookTimestamp } from "../src/lib/webhook-timestamp";

const NOW_MS = Date.UTC(2026, 10, 20, 12, 0, 0);
const nowSeconds = NOW_MS / 1000;

describe("isFreshWebhookTimestamp", () => {
  test.each([
    [String(nowSeconds), true],
    [String(nowSeconds - 300), true],
    [String(nowSeconds + 300), true],
    [String(nowSeconds - 301), false],
    [String(nowSeconds + 301), false],
    ["", false],
    ["not-a-number", false],
    [`${nowSeconds}.5`, false],
  ])("%s -> %p", (timestamp, expected) => {
    expect(isFreshWebhookTimestamp(timestamp, NOW_MS)).toBe(expected);
  });
});
