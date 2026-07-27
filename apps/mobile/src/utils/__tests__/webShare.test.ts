/** Verifies browser event sharing uses the available API and absorbs user cancellation. */
import { afterEach, describe, expect, it, vi } from "vitest";
import { shareEventOnWeb } from "../webShare";

type NavigatorDescriptor = PropertyDescriptor | undefined;

const originalNavigator: NavigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, "navigator");

function setNavigator(navigator: object): void {
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: navigator });
}

afterEach(() => {
  if (originalNavigator) {
    Object.defineProperty(globalThis, "navigator", originalNavigator);
  } else {
    delete (globalThis as { navigator?: Navigator }).navigator;
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

  it("treats an aborted share as cancellation rather than an unhandled failure", async () => {
    setNavigator({ share: vi.fn().mockRejectedValue(Object.assign(new Error("cancelled"), { name: "AbortError" })) });

    await expect(shareEventOnWeb("Welcome concert", "https://example.org/event")).resolves.toBe("cancelled");
  });

  it("returns a failure result when sharing or copying is rejected", async () => {
    setNavigator({ share: vi.fn().mockRejectedValue(new Error("denied")) });
    await expect(shareEventOnWeb("Welcome concert", "https://example.org/event")).resolves.toBe("failed");

    setNavigator({ clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } });
    await expect(shareEventOnWeb("Welcome concert", "https://example.org/event")).resolves.toBe("failed");
  });
});
