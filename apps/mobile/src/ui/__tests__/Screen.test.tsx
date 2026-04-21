import { describe, expect, it, vi } from "vitest";
import TestRenderer from "react-test-renderer";
import React from "react";
import { Screen } from "../Screen";

vi.mock("../ThemeContext", () => ({
  useTheme: () => ({
    colors: {
      background: "#101010",
      surface: "#181818",
      text: "#ffffff",
      muted: "#cccccc",
      accent: "#00d7ff",
      accentText: "#000000",
      border: "#444444",
      error: "#ff6b6b",
      success: "#68ff9a",
      warning: "#ffd84d",
      info: "#7dd3ff",
      overlay: "rgba(0,0,0,0.7)",
      disabled: "#7a7a7a",
      placeholder: "#9a9a9a",
    },
    ui: {
      fontScale: 1,
      controlScale: 1,
      borderWidth: 1,
      emphasisBorderWidth: 2,
      borderRadiusScale: 1,
    },
  }),
}));

// Mock react-native components
vi.mock("react-native", () => ({
  RefreshControl: ({ refreshing, onRefresh }: { refreshing: boolean; onRefresh?: () => void }) => (
    <div data-testid="refresh-control" data-refreshing={refreshing} onClick={onRefresh} />
  ),
  ScrollView: ({ children, contentContainerStyle, refreshControl, scrollEnabled }: { 
    children: React.ReactNode; 
    contentContainerStyle?: Record<string, unknown>;
    refreshControl?: React.ReactNode;
    scrollEnabled?: boolean;
  }) => (
    <div data-testid="scroll-view" data-scroll-enabled={scrollEnabled} style={contentContainerStyle}>
      {refreshControl}
      {children}
    </div>
  ),
  StyleSheet: {
    create: (styles: Record<string, unknown>) => styles,
  },
  View: ({ children, style }: { children: React.ReactNode; style?: Record<string, unknown> }) => (
    <div data-testid="view" style={style}>{children}</div>
  ),
}));

describe("Screen", () => {
  it("renders with children", () => {
    const tree = TestRenderer.create(
      <Screen>
        <div data-testid="child">Test Child</div>
      </Screen>
    );
    
    const instance = tree.root;
    const child = instance.findByProps({ "data-testid": "child" });
    
    expect(child.props.children).toBe("Test Child");
  });

  it("renders with scroll enabled by default", () => {
    const tree = TestRenderer.create(
      <Screen>
        <div>Content</div>
      </Screen>
    );
    
    const instance = tree.root;
    const scrollView = instance.findByProps({ "data-testid": "scroll-view" });
    
    expect(scrollView.props["data-scroll-enabled"]).toBe(true);
  });

  it("renders with scroll disabled when scroll prop is false", () => {
    const tree = TestRenderer.create(
      <Screen scroll={false}>
        <div>Content</div>
      </Screen>
    );
    
    const instance = tree.root;
    const scrollView = instance.findByProps({ "data-testid": "scroll-view" });
    
    expect(scrollView.props["data-scroll-enabled"]).toBe(false);
  });

  it("renders without refresh control when onRefresh is not provided", () => {
    const tree = TestRenderer.create(
      <Screen>
        <div>Content</div>
      </Screen>
    );
    
    const instance = tree.root;
    
    expect(() => instance.findByProps({ "data-testid": "refresh-control" })).toThrow();
  });

  it("renders with refresh control when onRefresh is provided", () => {
    const onRefresh = vi.fn();
    const tree = TestRenderer.create(
      <Screen onRefresh={onRefresh}>
        <div>Content</div>
      </Screen>
    );
    
    const instance = tree.root;
    const refreshControl = instance.findByProps({ "data-testid": "refresh-control" });
    
    expect(refreshControl).toBeDefined();
  });

  it("refresh control shows refreshing state", () => {
    const onRefresh = vi.fn();
    const tree = TestRenderer.create(
      <Screen refreshing={true} onRefresh={onRefresh}>
        <div>Content</div>
      </Screen>
    );
    
    const instance = tree.root;
    const refreshControl = instance.findByProps({ "data-testid": "refresh-control" });
    
    expect(refreshControl.props["data-refreshing"]).toBe(true);
  });

  it("refresh control shows not refreshing state", () => {
    const onRefresh = vi.fn();
    const tree = TestRenderer.create(
      <Screen refreshing={false} onRefresh={onRefresh}>
        <div>Content</div>
      </Screen>
    );
    
    const instance = tree.root;
    const refreshControl = instance.findByProps({ "data-testid": "refresh-control" });
    
    expect(refreshControl.props["data-refreshing"]).toBe(false);
  });

  it("calls onRefresh when refresh control is triggered", () => {
    const onRefresh = vi.fn();
    const tree = TestRenderer.create(
      <Screen refreshing={false} onRefresh={onRefresh}>
        <div>Content</div>
      </Screen>
    );
    
    const instance = tree.root;
    const refreshControl = instance.findByProps({ "data-testid": "refresh-control" });
    
    // Simulate refresh trigger
    refreshControl.props.onClick();
    
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("renders multiple children", () => {
    const tree = TestRenderer.create(
      <Screen>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
        <div data-testid="child-3">Child 3</div>
      </Screen>
    );
    
    const instance = tree.root;
    
    expect(instance.findByProps({ "data-testid": "child-1" })).toBeDefined();
    expect(instance.findByProps({ "data-testid": "child-2" })).toBeDefined();
    expect(instance.findByProps({ "data-testid": "child-3" })).toBeDefined();
  });

  it("renders nested components correctly", () => {
    const tree = TestRenderer.create(
      <Screen>
        <div data-testid="parent">
          <div data-testid="nested">Nested Content</div>
        </div>
      </Screen>
    );
    
    const instance = tree.root;
    
    expect(instance.findByProps({ "data-testid": "parent" })).toBeDefined();
    expect(instance.findByProps({ "data-testid": "nested" })).toBeDefined();
  });

  it("applies content container style", () => {
    const tree = TestRenderer.create(
      <Screen>
        <div>Content</div>
      </Screen>
    );
    
    const instance = tree.root;
    const scrollView = instance.findByProps({ "data-testid": "scroll-view" });
    
    // Should have style applied
    expect(scrollView.props.style).toBeDefined();
  });

  it("renders with scroll enabled explicitly", () => {
    const tree = TestRenderer.create(
      <Screen scroll={true}>
        <div>Content</div>
      </Screen>
    );
    
    const instance = tree.root;
    const scrollView = instance.findByProps({ "data-testid": "scroll-view" });
    
    expect(scrollView.props["data-scroll-enabled"]).toBe(true);
  });

  it("handles refresh without refreshing prop", () => {
    const onRefresh = vi.fn();
    const tree = TestRenderer.create(
      <Screen onRefresh={onRefresh}>
        <div>Content</div>
      </Screen>
    );
    
    const instance = tree.root;
    const refreshControl = instance.findByProps({ "data-testid": "refresh-control" });
    
    // Default refreshing should be false
    expect(refreshControl.props["data-refreshing"]).toBe(false);
  });

  it("renders empty content gracefully", () => {
    const tree = TestRenderer.create(<Screen>{null}</Screen>);
    
    const instance = tree.root;
    const scrollView = instance.findByProps({ "data-testid": "scroll-view" });
    
    expect(scrollView).toBeDefined();
  });

  it("renders with all props combined", () => {
    const onRefresh = vi.fn();
    const tree = TestRenderer.create(
      <Screen scroll={true} refreshing={false} onRefresh={onRefresh}>
        <div data-testid="content">Full Props Content</div>
      </Screen>
    );
    
    const instance = tree.root;
    
    expect(instance.findByProps({ "data-testid": "content" })).toBeDefined();
    expect(instance.findByProps({ "data-testid": "refresh-control" })).toBeDefined();
    expect(instance.findByProps({ "data-testid": "scroll-view" }).props["data-scroll-enabled"]).toBe(true);
  });
});
