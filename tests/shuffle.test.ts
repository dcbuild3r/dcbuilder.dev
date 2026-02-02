import { describe, test, expect } from "bun:test";
import {
  hashString,
  seededRandom,
  shuffleArray,
  isWithinDays,
  isNew,
} from "../src/lib/shuffle";

describe("hashString", () => {
  test("returns consistent hash for same input", () => {
    const hash1 = hashString("test");
    const hash2 = hashString("test");
    expect(hash1).toBe(hash2);
  });

  test("returns different hashes for different inputs", () => {
    const hash1 = hashString("test1");
    const hash2 = hashString("test2");
    expect(hash1).not.toBe(hash2);
  });

  test("returns positive number", () => {
    const hash = hashString("negative-test");
    expect(hash).toBeGreaterThanOrEqual(0);
  });

  test("handles empty string", () => {
    const hash = hashString("");
    expect(hash).toBe(0);
  });

  test("handles unicode characters", () => {
    const hash = hashString("こんにちは🎉");
    expect(typeof hash).toBe("number");
    expect(hash).toBeGreaterThanOrEqual(0);
  });
});

describe("seededRandom", () => {
  test("returns deterministic sequence for same seed", () => {
    const random1 = seededRandom(12345);
    const random2 = seededRandom(12345);

    const sequence1 = [random1(), random1(), random1()];
    const sequence2 = [random2(), random2(), random2()];

    expect(sequence1).toEqual(sequence2);
  });

  test("returns different sequences for different seeds", () => {
    const random1 = seededRandom(12345);
    const random2 = seededRandom(54321);

    const val1 = random1();
    const val2 = random2();

    expect(val1).not.toBe(val2);
  });

  test("returns values between 0 and 1", () => {
    const random = seededRandom(42);
    for (let i = 0; i < 100; i++) {
      const val = random();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });
});

describe("shuffleArray", () => {
  test("returns array of same length", () => {
    const arr = [1, 2, 3, 4, 5];
    const random = seededRandom(123);
    const shuffled = shuffleArray(arr, random);
    expect(shuffled.length).toBe(arr.length);
  });

  test("contains all original elements", () => {
    const arr = [1, 2, 3, 4, 5];
    const random = seededRandom(123);
    const shuffled = shuffleArray(arr, random);
    expect(shuffled.sort()).toEqual(arr.sort());
  });

  test("does not mutate original array", () => {
    const arr = [1, 2, 3, 4, 5];
    const original = [...arr];
    const random = seededRandom(123);
    shuffleArray(arr, random);
    expect(arr).toEqual(original);
  });

  test("produces deterministic result with same seed", () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const shuffled1 = shuffleArray(arr, seededRandom(42));
    const shuffled2 = shuffleArray(arr, seededRandom(42));
    expect(shuffled1).toEqual(shuffled2);
  });

  test("produces different results with different seeds", () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const shuffled1 = shuffleArray(arr, seededRandom(42));
    const shuffled2 = shuffleArray(arr, seededRandom(99));
    // Very unlikely to be equal with different seeds
    expect(shuffled1).not.toEqual(shuffled2);
  });

  test("handles empty array", () => {
    const arr: number[] = [];
    const random = seededRandom(123);
    const shuffled = shuffleArray(arr, random);
    expect(shuffled).toEqual([]);
  });

  test("handles single element array", () => {
    const arr = [1];
    const random = seededRandom(123);
    const shuffled = shuffleArray(arr, random);
    expect(shuffled).toEqual([1]);
  });
});

describe("isWithinDays", () => {
  test("returns true for date within threshold", () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isWithinDays(yesterday, 7)).toBe(true);
  });

  test("returns false for date outside threshold", () => {
    const today = new Date();
    const oldDate = new Date(today);
    oldDate.setDate(oldDate.getDate() - 30);
    expect(isWithinDays(oldDate, 7)).toBe(false);
  });

  test("returns false for null/undefined", () => {
    expect(isWithinDays(null, 7)).toBe(false);
    expect(isWithinDays(undefined, 7)).toBe(false);
  });

  test("handles string dates", () => {
    const today = new Date();
    const recentDate = new Date(today);
    recentDate.setDate(recentDate.getDate() - 3);
    expect(isWithinDays(recentDate.toISOString(), 7)).toBe(true);
  });

  test("edge case: exactly at threshold", () => {
    const today = new Date();
    const exactDate = new Date(today);
    exactDate.setDate(exactDate.getDate() - 7);
    // Should be false since it's exactly 7 days ago (not within)
    expect(isWithinDays(exactDate, 7)).toBe(false);
  });
});

describe("isNew", () => {
  test("returns true for recent items (within 14 days)", () => {
    const today = new Date();
    const recent = new Date(today);
    recent.setDate(recent.getDate() - 10);
    expect(isNew(recent)).toBe(true);
  });

  test("returns false for old items (over 14 days)", () => {
    const today = new Date();
    const old = new Date(today);
    old.setDate(old.getDate() - 20);
    expect(isNew(old)).toBe(false);
  });

  test("returns false for null/undefined", () => {
    expect(isNew(null)).toBe(false);
    expect(isNew(undefined)).toBe(false);
  });

  test("handles ISO string dates", () => {
    const recent = new Date();
    recent.setDate(recent.getDate() - 5);
    expect(isNew(recent.toISOString())).toBe(true);
  });
});
