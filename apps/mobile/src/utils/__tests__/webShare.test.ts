/** Verifies browser event sharing uses the available API and absorbs user cancellation. */
import { afterEach, describe, expect, it, vi } from "vitest";
import { shareEventOnWeb } from "../webShare";

type NavigatorDescriptor = PropertyDescriptor | undefined;

const originalNavigator: NavigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, "navigator");

function setNavigator(navigator: object): void {
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: navigator });
}

function clearNavigator(): void {
  delete (globalThis as { navigator?: Navigator }).navigator;
}

afterEach(() => {
  if (originalNavigator) {
    Object.defineProperty(globalThis, "navigator", originalNavigator);
  } else {
    clearNavigator();
  }
});

describe("shareEventOnWeb", () => {
  it("uses navigator.share when the browser exposes it", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setNavigator({ share });

    await expect(shareEventOnWeb("Welcome concert", "https://example.org/event")).resolves.toBe("shared");
    expect(share).toHaveBeenCalledWith({ title: "Welcome concert", text: "Welcome concert", url: "https://example.org/event" });
  });

  it("copies the link when Web Share is unavailable", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setNavigator({ clipboard: { writeText } });

    await expect(shareEventOnWeb("Welcome concert", "https://example.org/event")).resolves.toBe("copied");
    expect(writeText).toHaveBeenCalledWith("https://example.org/event");
  });

  it("fails when navigator or clipboard support is unavailable", async () => {
    clearNavigator();
    await expect(shareEventOnWeb("Welcome concert", "https://example.org/event")).resolves.toBe("failed");

    setNavigator({});
    await expect(shareEventOnWeb("Welcome concert", "https://example.org/event")).resolves.toBe("failed");
  });

  it("treats an aborted share as cancellation rather than an unhandled failure", async () => {
    setNavigator({ share: vi.fn().mockRejectedValue(Object.assign(new Error("cancelled"), { name: "AbortError" })) });

    await expect(shareEventOnWeb("Welcome concert", "https://example.org/event")).resolves.toBe("cancelled");
  });

  it("does not fall back to the clipboard when browser sharing is rejected", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setNavigator({ share: vi.fn().mockRejectedValue(new Error("denied")), clipboard: { writeText } });

    await expect(shareEventOnWeb("Welcome concert", "https://example.org/event")).resolves.toBe("failed");
    expect(writeText).not.toHaveBeenCalled();
  });

  it("absorbs synchronous share errors without falling back to the clipboard", async () => {
    const share = vi.fn(() => {
      throw new Error("denied");
    });
    const writeText = vi.fn().mockResolvedValue(undefined);
    setNavigator({ share, clipboard: { writeText } });

    await expect(shareEventOnWeb("Welcome concert", "https://example.org/event")).resolves.toBe("failed");
    expect(share).toHaveBeenCalledWith({ title: "Welcome concert", text: "Welcome concert", url: "https://example.org/event" });
    expect(writeText).not.toHaveBeenCalled();
  });

  it("returns a failure result when copying is rejected", async () => {
    setNavigator({ clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } });

    await expect(shareEventOnWeb("Welcome concert", "https://example.org/event")).resolves.toBe("failed");
  });

  it("absorbs synchronous clipboard errors", async () => {
    const writeText = vi.fn(() => {
      throw new Error("denied");
    });
    setNavigator({ clipboard: { writeText } });

    await expect(shareEventOnWeb("Welcome concert", "https://example.org/event")).resolves.toBe("failed");
    expect(writeText).toHaveBeenCalledWith("https://example.org/event");
  });
});
