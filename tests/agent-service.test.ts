import { describe, expect, mock, test } from "bun:test";

mock.module("@/db", () => ({
  db: {},
  apiKeys: {},
  agentAuditEvents: {},
  agentInboxComments: {},
  agentInboxSubmissions: {},
  agentInboxVersions: {},
  agentSubmitTokens: {},
  announcements: {},
  blogPosts: {},
  candidates: {},
  curatedLinks: {},
  affiliations: {},
  investments: {},
  jobs: {},
}));

const {
  buildAgentOpenApiDocument,
  parseAgentInviteInput,
  parseAgentFilters,
  redactAgentRecord,
  validateAgentQuery,
} = await import("../src/services/agent-api");
const { extractRequestToken } = await import("../src/services/auth");

describe("agent API contract helpers", () => {
  test("accepts bearer tokens and x-api-key for agent clients", () => {
    expect(
      extractRequestToken(
        new Request("https://dcbuilder.dev/api/agent/jobs", {
          headers: { authorization: "Bearer cli-token" },
        }) as never,
      ),
    ).toBe("cli-token");
    expect(
      extractRequestToken(
        new Request("https://dcbuilder.dev/api/agent/jobs", {
          headers: { "x-api-key": "admin-token" },
        }) as never,
      ),
    ).toBe("admin-token");
  });

  test("describes the agent API, inbox actions, submissions, and schema endpoint", () => {
    const doc = buildAgentOpenApiDocument();

    expect(doc.openapi).toBe("3.1.0");
    expect(doc.paths["/api/agent/schema"].get).toBeDefined();
    expect(doc.paths["/api/agent/news"].get).toBeDefined();
    expect(doc.paths["/api/agent/jobs"].get).toBeDefined();
    expect(doc.paths["/api/agent/candidates"].get).toBeDefined();
    expect(doc.paths["/api/agent/query"].post).toBeDefined();
    expect(doc.paths["/api/agent/inbox/{id}/approve"].post).toBeDefined();
    expect(doc.paths["/api/agent/submit/{kind}"].post).toBeDefined();
  });

  test("redacts candidate contact fields unless an elevated sensitive scope is present", () => {
    const candidate = {
      id: "cand_1",
      name: "Alice",
      email: "alice@example.com",
      telegram: "@alice",
      calendly: "https://cal.com/alice",
      x: "alice",
    };

    expect(redactAgentRecord("candidates", candidate, [])).toEqual({
      id: "cand_1",
      name: "Alice",
      email: null,
      telegram: null,
      calendly: null,
      x: "alice",
    });
    expect(redactAgentRecord("candidates", candidate, ["agent:sensitive"])).toEqual(candidate);
  });

  test("parses structured filters and rejects raw SQL in generic queries", () => {
    expect(parseAgentFilters(new URLSearchParams("limit=5&remote=true&tag=zk&tag=rust"))).toEqual({
      limit: 5,
      offset: 0,
      remote: true,
      tags: ["zk", "rust"],
    });

    expect(() =>
      validateAgentQuery({
        table: "jobs",
        where: [{ field: "company", op: "raw", value: "1=1; drop table jobs" }],
      }),
    ).toThrow(/Unsupported operator/);
  });

  test("normalizes scoped invite options for CLI-created submit tokens", () => {
    const invite = parseAgentInviteInput({
      allowedKinds: ["candidate", "message", "unknown", "candidate"],
      submitterName: "Partner Agent",
      submitterEmail: "partner@example.com",
      expiresInDays: 14,
      maxUses: 5,
    });

    expect(invite.allowedKinds).toEqual(["candidate", "message"]);
    expect(invite.submitterName).toBe("Partner Agent");
    expect(invite.submitterEmail).toBe("partner@example.com");
    expect(invite.maxUses).toBe(5);
    expect(invite.expiresAt.getTime()).toBeGreaterThan(Date.now() + 13 * 24 * 60 * 60 * 1000);
    expect(invite.expiresAt.getTime()).toBeLessThan(Date.now() + 15 * 24 * 60 * 60 * 1000);
  });
});
