import { describe, expect, test } from "bun:test";
import {
  compareNewsByDateAndRelevance,
  compareNewsByPostedAtAndRelevance,
} from "../src/lib/news-sorting";

describe("compareNewsByDateAndRelevance", () => {
  test("sorts newer days first, then same-day items by relevance", () => {
    const items = [
      { id: "older-high", date: "2026-04-22T23:00:00.000Z", relevance: 10 },
      { id: "newer-low", date: "2026-04-23T00:00:00.000Z", relevance: 1 },
      { id: "same-day-low-late", date: "2026-04-22T23:30:00.000Z", relevance: 2 },
      { id: "same-day-high-early", date: "2026-04-22T01:00:00.000Z", relevance: 9 },
    ];

    expect(items.sort(compareNewsByDateAndRelevance).map((item) => item.id)).toEqual([
      "newer-low",
      "older-high",
      "same-day-high-early",
      "same-day-low-late",
    ]);
  });

  test("keeps same-day relevance descending when date sort is ascending", () => {
    const items = [
      { id: "newer", date: "2026-04-23", relevance: 1 },
      { id: "older-low", date: "2026-04-22", relevance: 2 },
      { id: "older-high", date: "2026-04-22", relevance: 8 },
    ];

    expect(
      items.sort((a, b) => compareNewsByDateAndRelevance(a, b, "asc")).map((item) => item.id)
    ).toEqual(["older-high", "older-low", "newer"]);
  });
});

describe("compareNewsByPostedAtAndRelevance", () => {
  test("sorts by the exact posted timestamp before source content date", () => {
    const items = [
      {
        id: "newer-content",
        date: "2026-04-29",
        postedAt: "2026-04-29T08:00:00.000Z",
        relevance: 10,
      },
      {
        id: "newer-posted",
        date: "2026-04-20",
        postedAt: "2026-04-29T09:00:00.000Z",
        relevance: 1,
      },
      {
        id: "older-posted",
        date: "2026-04-30",
        postedAt: "2026-04-28T23:00:00.000Z",
        relevance: 10,
      },
    ];

    expect(items.sort(compareNewsByPostedAtAndRelevance).map((item) => item.id)).toEqual([
      "newer-posted",
      "newer-content",
      "older-posted",
    ]);
  });

  test("falls back to relevance when posted timestamps match", () => {
    const items = [
      { id: "low", date: "2026-04-29", postedAt: "2026-04-29T08:00:00.000Z", relevance: 1 },
      { id: "high", date: "2026-04-28", postedAt: "2026-04-29T08:00:00.000Z", relevance: 9 },
    ];

    expect(items.sort(compareNewsByPostedAtAndRelevance).map((item) => item.id)).toEqual([
      "high",
      "low",
    ]);
  });
});
