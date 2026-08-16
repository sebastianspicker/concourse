/** Verifies loading skeletons preserve structure while remaining hidden from accessibility trees. */
import React from "react";
import TestRenderer from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { Skeleton, SkeletonCard, SkeletonDetail, SkeletonList, SkeletonSchedule, SkeletonScheduleItem } from "../Skeleton";

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

  it.each([
    ["card", SkeletonCard],
    ["schedule item", SkeletonScheduleItem],
  ] as const)("announces standalone %s skeletons by default", (_name, Component) => {
    const tree = TestRenderer.create(<Component />);
    const statuses = tree.root.findAllByProps({ role: "progressbar" });

    expect(statuses).toHaveLength(1);
    expect(statuses[0].props.accessibilityLabel).toBe("Loading");
    expect(statuses[0].props.accessibilityState).toEqual({ busy: true });
  });

  it.each([
    ["card", SkeletonCard],
    ["schedule item", SkeletonScheduleItem],
  ] as const)("hides standalone %s skeleton descendants when announcement is disabled", (_name, Component) => {
    const tree = TestRenderer.create(<Component announceLoading={false} />);
    const region = tree.root.findByType("div");

    expect(tree.root.findAllByProps({ role: "progressbar" })).toHaveLength(0);
    expect(region.props.accessibilityElementsHidden).toBe(true);
    expect(region.props.importantForAccessibility).toBe("no-hide-descendants");
  });

  it.each([
    [
      "card",
      SkeletonList,
      3,
      "60%",
      18,
      ["\"alignItems\":\"center\"", "\"gap\":12", "\"backgroundColor\":\"#fff\"", "\"borderBottomColor\":\"#ddd\"", "\"borderBottomWidth\":1", "\"minHeight\":76", "\"paddingHorizontal\":12", "\"paddingVertical\":20"],
    ],
    [
      "schedule",
      SkeletonSchedule,
      4,
      50,
      14,
      ["\"alignItems\":\"stretch\"", "\"gap\":12", "\"backgroundColor\":\"#fff\"", "\"borderBottomColor\":\"#ddd\"", "\"borderBottomWidth\":1", "\"minHeight\":76", "\"paddingHorizontal\":12", "\"paddingVertical\":12"],
    ],
  ] as const)("keeps %s list defaults, one localized status, hidden rows, and visual geometry", (_name, Component, count, firstWidth, firstHeight, rowStyleTokens) => {
    const tree = TestRenderer.create(<Component />);
    const statuses = tree.root.findAllByProps({ role: "progressbar" });
    const rows = tree.root.findAll((node) => {
      const style = node.props["data-style"] as string | undefined;
      return node.type === "div" && node.props.accessible === false && style?.includes("\"flexDirection\":\"row\"") === true;
    });
    const skeletonBlocks = tree.root.findAll((node) => {
      const style = node.props["data-style"] as string | undefined;
      return style?.includes(`"width":${JSON.stringify(firstWidth)}`) === true && style.includes(`"height":${firstHeight}`);
    });

    expect(statuses).toHaveLength(1);
    expect(statuses[0].props.accessibilityLabel).toBe("Loading");
    expect(statuses[0].props.accessibilityState).toEqual({ busy: true });
    expect(statuses[0].props["data-style"]).toContain("\"borderTopWidth\":1");
    expect(rows).toHaveLength(count);
    expect(rows.every((row) => row.props.accessibilityElementsHidden)).toBe(true);
    expect(rows.every((row) => row.props.importantForAccessibility === "no-hide-descendants")).toBe(true);
    expect(rows.every((row) => rowStyleTokens.every((token) => row.props["data-style"].includes(token)))).toBe(true);
    expect(skeletonBlocks).toHaveLength(count);
  });

  it.each([
    ["card", SkeletonList, 2],
    ["schedule", SkeletonSchedule, 2],
  ] as const)("keeps %s list row counts explicit", (_name, Component, count) => {
    const tree = TestRenderer.create(<Component count={count} />);
    const rows = tree.root.findAll((node) => {
      const style = node.props["data-style"] as string | undefined;
      return node.type === "div" && node.props.accessible === false && style?.includes("\"flexDirection\":\"row\"") === true;
    });

    expect(rows).toHaveLength(count);
  });

  it("retains the standalone detail status", () => {
    const tree = TestRenderer.create(<SkeletonDetail />);
    expect(tree.root.findAllByProps({ role: "progressbar" })).toHaveLength(1);
  });
});
