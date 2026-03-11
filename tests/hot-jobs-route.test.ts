import { afterEach, describe, expect, mock, test } from "bun:test";

describe("GET /api/hot-jobs", () => {
  afterEach(() => {
    mock.restore();
  });

  test("returns hot job ids without querying the jobs table", async () => {
    const actualPosthog = await import("../src/services/posthog");
    const getJobApplyClicksLast7Days = mock(async () => ({
      success: true as const,
      data: [
        { id: "wonderland-solidity-developer", count: 12 },
        { id: "stale-job-id", count: 7 },
      ],
    }));
    const determineHotJobs = mock(() => ["wonderland-solidity-developer"]);

    mock.module("@/services/posthog", () => ({
      ...actualPosthog,
      getJobApplyClicksLast7Days,
      determineHotJobs,
    }));

    const { GET } = await import("../src/app/api/hot-jobs/route");
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.hotJobIds).toEqual(["wonderland-solidity-developer"]);
    expect(typeof payload.updatedAt).toBe("string");
    expect(getJobApplyClicksLast7Days).toHaveBeenCalledTimes(1);
    expect(determineHotJobs).toHaveBeenCalledWith(
      [
        { id: "wonderland-solidity-developer", count: 12 },
        { id: "stale-job-id", count: 7 },
      ],
      5,
    );
  });
});
