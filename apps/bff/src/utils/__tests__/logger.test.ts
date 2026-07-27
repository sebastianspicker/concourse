/** Verifies structured logging behavior and redaction boundaries. */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { log } from "../logger";

describe("logger", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("outputs structured JSON", () => {
    log("info", "test_message", { key: "value" });
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(output.level).toBe("info");
    expect(output.message).toBe("test_message");
    expect(output.context.key).toBe("value");
    expect(output.ts).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("sanitizes sensitive keys from context", () => {
    log("info", "auth_event", {
      userId: "user-1",
      authorization: "Bearer secret-token",
      password: "hunter2",
      token: "abc123",
    });
    const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(output.context.userId).toBe("user-1");
    expect(output.context.authorization).toBeUndefined();
    expect(output.context.password).toBeUndefined();
    expect(output.context.token).toBeUndefined();
  });

  it("sanitizes nested sensitive keys", () => {
    log("warn", "nested", {
      data: { cookie: "session=abc", name: "visible" },
    });
    const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(output.context.data.cookie).toBeUndefined();
    expect(output.context.data.name).toBe("visible");
  });

  it("handles circular references", () => {
    const obj: Record<string, unknown> = { name: "circular" };
    obj.self = obj;
    log("info", "circular_test", { obj });
    const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(output.context.obj.self).toBe("[Circular]");
  });

  it("handles empty context", () => {
    log("debug", "no_context");
    const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(output.context).toEqual({});
  });
});
