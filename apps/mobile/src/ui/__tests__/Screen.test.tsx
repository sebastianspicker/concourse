import React from "react";
import TestRenderer from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { Screen } from "../Screen";

vi.mock("../ThemeContext", () => ({ useTheme: () => ({ colors: { background: "#fff", surface: "#fff", accent: "#176B87" }, ui: { controlScale: 1 } }) }));
vi.mock("react-native", () => ({
  RefreshControl: ({ refreshing, onRefresh }: { refreshing: boolean; onRefresh: () => void }) => <button data-testid="refresh-control" data-refreshing={refreshing} onClick={onRefresh} />,
  ScrollView: ({ children, refreshControl }: { children: React.ReactNode; refreshControl?: React.ReactNode }) => <div data-testid="scroll-view">{refreshControl}{children}</div>,
  View: ({ children, testID }: { children: React.ReactNode; testID?: string }) => <div data-testid={testID}>{children}</div>,
  StyleSheet: { create: (styles: object) => styles },
}));

describe("Screen", () => {
  it("uses a scroll surface by default", () => {
    const tree = TestRenderer.create(<Screen><span>content</span></Screen>);
    expect(tree.root.findByProps({ "data-testid": "scroll-view" })).toBeDefined();
  });

  it("uses a bounded non-scrolling surface for virtualized lists", () => {
    const tree = TestRenderer.create(<Screen scroll={false} testID="screen"><span>content</span></Screen>);
    expect(tree.root.findByProps({ "data-testid": "screen" })).toBeDefined();
    expect(tree.root.findAllByProps({ "data-testid": "scroll-view" })).toHaveLength(0);
  });

  it("wires pull-to-refresh only when requested", () => {
    const refresh = vi.fn();
    const tree = TestRenderer.create(<Screen refreshing onRefresh={refresh}><span>content</span></Screen>);
    const control = tree.root.findByProps({ "data-testid": "refresh-control" });
    expect(control.props["data-refreshing"]).toBe(true);
    control.props.onClick();
    expect(refresh).toHaveBeenCalledOnce();
  });
});
