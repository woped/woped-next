import { describe, it, expect, vi, afterEach } from "vitest";
import { pingService } from "@/services/tools/serviceHealth";

describe("pingService", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns true when the endpoint responds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 200 })),
    );

    await expect(pingService("http://localhost:8080/health")).resolves.toBe(true);
  });

  it("returns true even for an error status (server is reachable)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 405 })),
    );

    await expect(pingService("http://localhost:8080/t2p")).resolves.toBe(true);
  });

  it("returns false on a network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("connection refused");
      }),
    );

    await expect(pingService("http://localhost:9999")).resolves.toBe(false);
  });

  it("returns false for an empty URL without calling fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(pingService("")).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
