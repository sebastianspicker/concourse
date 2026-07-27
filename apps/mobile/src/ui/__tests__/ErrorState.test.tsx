/** Verifies recoverable errors expose the correct retry and navigation actions. */
import React from "react";
import TestRenderer from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { ErrorState, getErrorType } from "../ErrorState";

vi.mock("expo-router", () => ({ useNavigation: () => ({ canGoBack: () => false, goBack: vi.fn() }) }));
vi.mock("../ThemeContext", () => ({ useTheme: () => ({ colors: { text: "#17202A", muted: "#5C6873", accent: "#176B87", accentText: "#fff", border: "#777", error: "#A12027" }, ui: { fontScale: 1, controlScale: 1, borderWidth: 1, emphasisBorderWidth: 2 } }) }));
vi.mock("react-native", () => ({
  Pressable: ({ children, onPress, accessibilityLabel }: { children: React.ReactNode; onPress: () => void; accessibilityLabel: string }) => <button aria-label={accessibilityLabel} onClick={onPress}>{children}</button>,
  Text: ({ children, accessibilityRole }: { children: React.ReactNode; accessibilityRole?: string }) => <span role={accessibilityRole}>{children}</span>,
  View: ({ children, accessibilityRole, ...props }: { children: React.ReactNode; accessibilityRole?: string; [key: string]: unknown }) => <div role={accessibilityRole} {...props}>{children}</div>,
  StyleSheet: { create: (styles: object) => styles },
}));

function textContent(tree: TestRenderer.ReactTestRenderer): string {
  return tree.root.findAllByType("span").map((node) => node.props.children).flat().join(" ");
}

describe("ErrorState", () => {
  it("shows localized safe copy for typed failures", () => {
    const tree = TestRenderer.create(<ErrorState error={{ kind: "institutionMismatch", messageKey: "errorInstitutionMismatch" }} />);
    expect(textContent(tree)).toContain("configured for different institutions");
  });

  it.each([
    ["network", "Connection problem"],
    ["notFound", "Not found"],
    ["generic", "Something went wrong"],
  ] as const)("maps %s to a clear title", (errorType, title) => {
    const tree = TestRenderer.create(<ErrorState errorType={errorType} message="Details" />);
    expect(textContent(tree)).toContain(title);
  });

  it("exposes a named retry action", () => {
    const retry = vi.fn();
    const tree = TestRenderer.create(<ErrorState message="Details" onRetry={retry} />);
    const button = tree.root.findByProps({ "aria-label": "Try again" });
    button.props.onClick();
    expect(retry).toHaveBeenCalledOnce();
  });

  it("infers headings centrally from typed UI errors", () => {
    expect(getErrorType({ kind: "offline", messageKey: "errorOffline" })).toBe("network");
    expect(getErrorType({ kind: "notFound", messageKey: "errorNotFound" })).toBe("notFound");
    expect(getErrorType({ kind: "server", messageKey: "errorServer" })).toBe("generic");
  });

  it("announces an asynchronous error and exposes its title as a heading", () => {
    const tree = TestRenderer.create(<ErrorState message="Details" />);
    const alert = tree.root.findByProps({ role: "alert" });
    expect(alert.props.accessibilityLiveRegion).toBe("assertive");
    expect(tree.root.findByProps({ role: "header" }).props.children).toBe("Something went wrong");
    expect(alert.props["aria-live"]).toBeUndefined();
  });
});
