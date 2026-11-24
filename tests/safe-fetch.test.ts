import { afterEach, describe, expect, mock, test } from "bun:test";
import { isPublicAddress, safeFetchText } from "../src/lib/safe-fetch";

const originalFetch = globalThis.fetch;

describe("isPublicAddress", () => {
  test.each([
    "127.0.0.1",
    "10.1.2.3",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "0.0.0.0",
    "::",
    "::1",
    "fe80::1",
    "fc00::1",
    "fd12:3456::1",
    "::ffff:127.0.0.1",
    "::ffff:a9fe:a9fe",
    "::ffff:10.0.0.1",
    "not-an-ip",
  ])("rejects %s", (address) => {
    expect(isPublicAddress(address)).toBe(false);
  });

  test.each(["8.8.8.8", "172.32.0.1", "100.128.0.1", "2606:4700:4700::1111", "::ffff:8.8.8.8"])(
    "accepts %s",
    (address) => {
      expect(isPublicAddress(address)).toBe(true);
    },
  );
});

describe("safeFetchText", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("rejects non-https and private hosts without fetching", async () => {
    const fetchSpy = mock(async () => new Response("nope"));
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    await expect(safeFetchText("http://8.8.8.8/job")).rejects.toThrow(/https/);
    await expect(safeFetchText("https://127.0.0.1/job")).rejects.toThrow(/Blocked host/);
    await expect(safeFetchText("https://[::1]/job")).rejects.toThrow(/Blocked host/);
    await expect(safeFetchText("https://2130706433/job")).rejects.toThrow(/Blocked host/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("re-validates each redirect hop", async () => {
    const fetchSpy = mock(async () =>
      new Response(null, { status: 302, headers: { location: "https://169.254.169.254/latest/meta-data" } }),
    );
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    await expect(safeFetchText("https://8.8.8.8/job")).rejects.toThrow(/Blocked host/);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  test("stops after three redirects", async () => {
    const fetchSpy = mock(async () =>
      new Response(null, { status: 301, headers: { location: "https://8.8.4.4/next" } }),
    );
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    await expect(safeFetchText("https://8.8.8.8/job")).rejects.toThrow(/Too many redirects/);
    expect(fetchSpy).toHaveBeenCalledTimes(4);
  });

  test("aborts bodies over 1 MB", async () => {
    const chunk = new Uint8Array(256 * 1024);
    globalThis.fetch = mock(async () =>
      new Response(
        new ReadableStream({
          pull(controller) {
            controller.enqueue(chunk);
          },
        }),
      ),
    ) as unknown as typeof fetch;

    await expect(safeFetchText("https://8.8.8.8/job")).rejects.toThrow(/too large/);
  });

  test("returns text for a public https page", async () => {
    globalThis.fetch = mock(async () => new Response("<p>Hello</p>")) as unknown as typeof fetch;

    expect(await safeFetchText("https://8.8.8.8/job")).toEqual({ ok: true, status: 200, text: "<p>Hello</p>" });
  });
});
