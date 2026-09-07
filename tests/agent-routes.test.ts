import { afterEach, describe, expect, mock, test } from "bun:test";

describe("agent API routes", () => {
  afterEach(() => {
    mock.restore();
  });

  test("POST /api/agent/inbox/[id]/approve requires admin write and publishes through the agent service", async () => {
    let requestedPermission: string | undefined;
    let approvedId: string | undefined;

    mock.module("@/services/auth", () => ({
      ...authMockHelpers(),
      requireAuth: async (_request: Request, permission?: string) => {
        requestedPermission = permission;
        return { valid: true as const, keyId: "admin_key", name: "Admin", permissions: ["*"] };
      },
    }));
    mock.module("@/services/agent-api", () => ({
      ...agentApiMockHelpers(),
      approveAgentSubmission: async (id: string, input: unknown) => {
        approvedId = id;
        return {
          id,
          status: "approved",
          liveRecordId: "job_123",
          input,
        };
      },
    }));

    const { POST } = await import("../src/app/api/agent/inbox/[id]/approve/route");
    const response = await POST(
      new Request("https://dcbuilder.dev/api/agent/inbox/sub_1/approve", {
        method: "POST",
        body: JSON.stringify({ note: "ship it" }),
      }) as never,
      { params: Promise.resolve({ id: "sub_1" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(requestedPermission).toBe("admin:write");
    expect(approvedId).toBe("sub_1");
    expect(body.data.liveRecordId).toBe("job_123");
  });

  test("POST /api/agent/submit/[kind] allows unauthenticated public general messages only", async () => {
    const submissions: unknown[] = [];

    mock.module("@/services/agent-api", () => ({
      ...agentApiMockHelpers(),
      createAgentSubmissionFromRequest: async (kind: string, request: Request, actor: unknown) => {
        submissions.push({ kind, actor, body: await request.json() });
        return { id: "sub_public", kind, priority: "low", status: "pending" };
      },
    }));

    const { POST } = await import("../src/app/api/agent/submit/[kind]/route");
    const response = await POST(
      new Request("https://dcbuilder.dev/api/agent/submit/message", {
        method: "POST",
        body: JSON.stringify({ message: "hello" }),
      }) as never,
      { params: Promise.resolve({ kind: "message" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data.priority).toBe("low");
    expect(submissions).toHaveLength(1);
  });
});

function authMockHelpers() {
  return {
    extractRequestToken: (request: Request) =>
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ||
      request.headers.get("x-api-key") ||
      null,
    validateApiKey: async () => ({ valid: false as const, error: "Invalid API key" }),
  };
}

function agentApiMockHelpers() {
  class AgentHttpError extends Error {
    constructor(
      readonly status: number,
      message: string,
    ) {
      super(message);
    }
  }

  return {
    AgentHttpError,
    approveAgentSubmission: async () => ({}),
    createAgentSubmissionFromRequest: async () => ({}),
    buildAgentOpenApiDocument: () => ({
      openapi: "3.1.0",
      paths: {
        "/api/agent/schema": { get: {} },
        "/api/agent/news": { get: {} },
        "/api/agent/jobs": { get: {} },
        "/api/agent/candidates": { get: {} },
        "/api/agent/query": { post: {} },
        "/api/agent/inbox/{id}/approve": { post: {} },
        "/api/agent/submit/{kind}": { post: {} },
      },
    }),
    parseAgentFilters: (params: URLSearchParams) => ({
      limit: Number(params.get("limit") || 50),
      ...(params.get("remote") ? { remote: params.get("remote") === "true" } : {}),
      ...(params.getAll("tag").length ? { tags: params.getAll("tag") } : {}),
    }),
    parseAgentInviteInput: () => ({
      allowedKinds: ["candidate", "message"],
      submitterName: "Partner Agent",
      submitterEmail: "partner@example.com",
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      maxUses: 5,
    }),
    redactAgentRecord: (resource: string, record: Record<string, unknown>, permissions: string[]) => {
      if (permissions.includes("agent:sensitive")) return record;
      if (resource !== "candidates") return record;
      return { ...record, email: null, telegram: null, calendly: null };
    },
    validateAgentQuery: (input: { where?: Array<{ op?: string }> }) => {
      if (input.where?.some((condition) => condition.op === "raw")) {
        throw new Error("Unsupported operator");
      }
      return input;
    },
  };
}
