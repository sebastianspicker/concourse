import React from "react";
import TestRenderer from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { Skeleton, SkeletonDetail, SkeletonList } from "../Skeleton";

vi.mock("../ThemeContext", () => ({ useTheme: () => ({ colors: { muted: "#5C6873", surface: "#fff", border: "#ddd" }, ui: { controlScale: 1, borderRadiusScale: 1, borderWidth: 1 } }) }));
vi.mock("react-native", () => ({
  View: ({ children, accessibilityRole, style }: { children?: React.ReactNode; accessibilityRole?: string; style?: unknown }) => <div role={accessibilityRole} data-style={JSON.stringify(style)}>{children}</div>,
  StyleSheet: { create: (styles: object) => styles },
}));

describe("static loading skeletons", () => {
  it("renders a non-animated progress placeholder", () => {
    const tree = TestRenderer.create(<Skeleton width={200} height={20} />);
    expect(tree.root.findByProps({ role: "progressbar" })).toBeDefined();
  });

  it("renders the requested bounded list count", () => {
    const tree = TestRenderer.create(<SkeletonList count={4} />);
    expect(tree.root.findAllByProps({ role: "progressbar" }).length).toBeGreaterThanOrEqual(4);
  });

  it("renders a detail placeholder without animation dependencies", () => {
    const tree = TestRenderer.create(<SkeletonDetail />);
    expect(tree.root.findAllByProps({ role: "progressbar" }).length).toBeGreaterThan(3);
  });
});
