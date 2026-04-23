import { afterEach, describe, expect, mock, test } from "bun:test";
import { dbTableExportPlaceholders } from "./helpers/db-module-mock";

describe("GET /api/hot-candidates", () => {
  afterEach(() => {
    mock.restore();
  });

  test("filters not-looking candidates out of the hot candidate ids", async () => {
    const actualPosthog = await import("../src/services/posthog");

    const getCandidateViewsLast7Days = mock(async () => ({
      success: true as const,
      data: [
        { id: "looking-candidate", count: 12 },
        { id: "not-looking-candidate", count: 11 },
        { id: "open-candidate", count: 10 },
      ],
    }));
    const determineHotCandidates = mock(() => [
      "looking-candidate",
      "not-looking-candidate",
      "open-candidate",
    ]);
    const where = mock(async () => [
      { id: "looking-candidate", availability: "looking" },
      { id: "not-looking-candidate", availability: "not-looking" },
      { id: "open-candidate", availability: "open" },
    ]);

    mock.module("@/services/posthog", () => ({
      ...actualPosthog,
      getCandidateViewsLast7Days,
      determineHotCandidates,
    }));

    mock.module("@/db", () => ({
      ...dbTableExportPlaceholders,
      db: {
        select: () => ({
          from: () => ({
            where,
          }),
        }),
      },
      candidates: {
        id: "id",
        availability: "availability",
      },
    }));

    const { GET } = await import("../src/app/api/hot-candidates/route");
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.hotCandidateIds).toEqual([
      "looking-candidate",
      "open-candidate",
    ]);
    expect(typeof payload.updatedAt).toBe("string");
    expect(getCandidateViewsLast7Days).toHaveBeenCalledTimes(1);
    expect(determineHotCandidates).toHaveBeenCalledWith(
      [
        { id: "looking-candidate", count: 12 },
        { id: "not-looking-candidate", count: 11 },
        { id: "open-candidate", count: 10 },
      ],
      3,
    );
    expect(where).toHaveBeenCalledTimes(1);
  });
});
