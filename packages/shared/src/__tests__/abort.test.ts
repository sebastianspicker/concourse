/** Verifies shared cancellation observes pending work even when cancellation won the race. */
/// <reference lib="dom" />
import { describe, expect, it, vi } from "vitest";
import { raceWithAbort } from "../abort";

describe("raceWithAbort", () => {
  it("keeps the input rejection handled when the signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    let rejectInput!: (error: Error) => void;
    const input = new Promise<void>((_resolve, reject) => {
      rejectInput = reject;
    });
    const thenSpy = vi.spyOn(input, "then");

    const raced = raceWithAbort(input, controller.signal, () => new Error("aborted"));
    await expect(raced).rejects.toThrow("aborted");
    expect(thenSpy).toHaveBeenCalledOnce();

    rejectInput(new Error("late input failure"));
    await Promise.resolve();
  });
});
