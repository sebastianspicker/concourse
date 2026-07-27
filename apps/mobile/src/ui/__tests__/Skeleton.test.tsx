/** Verifies loading skeletons preserve structure while remaining hidden from accessibility trees. */
import React from "react";
import TestRenderer from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { Skeleton, SkeletonDetail, SkeletonList, SkeletonSchedule } from "../Skeleton";

vi.mock("../ThemeContext", () => ({ useTheme: () => ({ colors: { muted: "#5C6873", surface: "#fff", border: "#ddd" }, ui: { controlScale: 1, borderRadiusScale: 1, borderWidth: 1 } }) }));
vi.mock("react-native", () => ({
  View: ({ children, accessibilityRole, style, ...props }: { children?: React.ReactNode; accessibilityRole?: string; style?: unknown; [key: string]: unknown }) => <div role={accessibilityRole} data-style={JSON.stringify(style)} {...props}>{children}</div>,
  StyleSheet: { create: (styles: object) => styles },
}));

describe("static loading skeletons", () => {
  it("hides decorative loading blocks from assistive technologies", () => {
    const tree = TestRenderer.create(<Skeleton width={200} height={20} />);
    const block = tree.root.findByType("div");
    expect(block.props.accessibilityElementsHidden).toBe(true);
    expect(block.props.importantForAccessibility).toBe("no-hide-descendants");
    expect(tree.root.findAllByProps({ role: "progressbar" })).toHaveLength(0);
  });

  it("exposes one localized busy status for a list region", () => {
    const tree = TestRenderer.create(<SkeletonList count={4} />);
    const statuses = tree.root.findAllByProps({ role: "progressbar" });
    expect(statuses).toHaveLength(1);
    expect(statuses[0].props.accessibilityLabel).toBe("Loading");
    expect(statuses[0].props.accessibilityState).toEqual({ busy: true });
  });

  it("exposes one busy status for each standalone skeleton region", () => {
    const tree = TestRenderer.create(<SkeletonDetail />);
    expect(tree.root.findAllByProps({ role: "progressbar" })).toHaveLength(1);

    const scheduleTree = TestRenderer.create(<SkeletonSchedule count={4} />);
    expect(scheduleTree.root.findAllByProps({ role: "progressbar" })).toHaveLength(1);
  });
});
