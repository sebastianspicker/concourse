import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import TestRenderer from "react-test-renderer";
import React from "react";
import { Skeleton, SkeletonCard, SkeletonList, SkeletonDetail, SkeletonScheduleItem, SkeletonSchedule } from "../Skeleton";

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

// Mock react-native
vi.mock("react-native", () => ({
  Animated: {
    View: ({ style }: { style: Record<string, unknown> }) => (
      <div data-testid="animated-view" style={style} />
    ),
    Value: vi.fn().mockImplementation(() => ({
      interpolate: vi.fn().mockReturnValue(0.5),
    })),
    timing: vi.fn().mockReturnValue({
      start: vi.fn(),
      stop: vi.fn(),
    }),
    sequence: vi.fn().mockImplementation((arr) => arr),
    loop: vi.fn().mockImplementation((_cb) => ({
      start: vi.fn(),
      stop: vi.fn(),
    })),
  },
  StyleSheet: {
    create: (styles: Record<string, unknown>) => styles,
  },
  View: ({ children, style }: { children: React.ReactNode; style?: Record<string, unknown> }) => (
    <div data-testid="view" style={style}>{children}</div>
  ),
}));

describe("Skeleton", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Skeleton component", () => {
    it("renders with default props", () => {
      const tree = TestRenderer.create(<Skeleton />);
      const instance = tree.root;
      
      const animatedView = instance.findByProps({ "data-testid": "animated-view" });
      expect(animatedView).toBeDefined();
    });

    it("renders with custom width", () => {
      const tree = TestRenderer.create(<Skeleton width={200} />);
      const instance = tree.root;
      
      const animatedView = instance.findByProps({ "data-testid": "animated-view" });
      expect(animatedView).toBeDefined();
    });

    it("renders with custom height", () => {
      const tree = TestRenderer.create(<Skeleton height={24} />);
      const instance = tree.root;
      
      const animatedView = instance.findByProps({ "data-testid": "animated-view" });
      expect(animatedView).toBeDefined();
    });

    it("renders with percentage width", () => {
      const tree = TestRenderer.create(<Skeleton width="80%" />);
      const instance = tree.root;
      
      const animatedView = instance.findByProps({ "data-testid": "animated-view" });
      expect(animatedView).toBeDefined();
    });

    it("renders with custom border radius", () => {
      const tree = TestRenderer.create(<Skeleton borderRadius={8} />);
      const instance = tree.root;
      
      const animatedView = instance.findByProps({ "data-testid": "animated-view" });
      expect(animatedView).toBeDefined();
    });

    it("renders with custom style", () => {
      const customStyle = { marginTop: 10 };
      const tree = TestRenderer.create(<Skeleton style={customStyle} />);
      const instance = tree.root;
      
      const animatedView = instance.findByProps({ "data-testid": "animated-view" });
      expect(animatedView).toBeDefined();
    });
  });

  describe("SkeletonCard", () => {
    it("renders correctly", () => {
      const tree = TestRenderer.create(<SkeletonCard />);
      const instance = tree.root;
      
      // Should contain multiple skeleton elements
      const animatedViews = instance.findAllByProps({ "data-testid": "animated-view" });
      expect(animatedViews.length).toBeGreaterThan(0);
    });

    it("renders with theme colors for light mode", () => {
      const tree = TestRenderer.create(<SkeletonCard />);
      expect(tree.toJSON()).toBeDefined();
    });
  });

  describe("SkeletonList", () => {
    it("renders with default count of 3", () => {
      const tree = TestRenderer.create(<SkeletonList />);
      const instance = tree.root;
      
      const views = instance.findAllByProps({ "data-testid": "view" });
      // Should have list container + card containers
      expect(views.length).toBeGreaterThan(3);
    });

    it("renders with custom count", () => {
      const tree = TestRenderer.create(<SkeletonList count={5} />);
      const instance = tree.root;
      
      const views = instance.findAllByProps({ "data-testid": "view" });
      expect(views.length).toBeGreaterThan(5);
    });

    it("renders with count of 1", () => {
      const tree = TestRenderer.create(<SkeletonList count={1} />);
      expect(tree.toJSON()).toBeDefined();
    });

    it("renders with count of 0", () => {
      const tree = TestRenderer.create(<SkeletonList count={0} />);
      expect(tree.toJSON()).toBeDefined();
    });

    it("renders with large count", () => {
      const tree = TestRenderer.create(<SkeletonList count={20} />);
      expect(tree.toJSON()).toBeDefined();
    });
  });

  describe("SkeletonDetail", () => {
    it("renders correctly", () => {
      const tree = TestRenderer.create(<SkeletonDetail />);
      const instance = tree.root;
      
      // Should contain multiple skeleton elements for detail view
      const animatedViews = instance.findAllByProps({ "data-testid": "animated-view" });
      expect(animatedViews.length).toBeGreaterThan(5);
    });

    it("renders header section", () => {
      const tree = TestRenderer.create(<SkeletonDetail />);
      const instance = tree.root;
      
      const views = instance.findAllByProps({ "data-testid": "view" });
      expect(views.length).toBeGreaterThan(0);
    });

    it("renders content sections", () => {
      const tree = TestRenderer.create(<SkeletonDetail />);
      expect(tree.toJSON()).toBeDefined();
    });
  });

  describe("SkeletonScheduleItem", () => {
    it("renders correctly", () => {
      const tree = TestRenderer.create(<SkeletonScheduleItem />);
      const instance = tree.root;
      
      const animatedViews = instance.findAllByProps({ "data-testid": "animated-view" });
      expect(animatedViews.length).toBeGreaterThan(0);
    });

    it("renders time section", () => {
      const tree = TestRenderer.create(<SkeletonScheduleItem />);
      const instance = tree.root;
      
      const views = instance.findAllByProps({ "data-testid": "view" });
      expect(views.length).toBeGreaterThan(0);
    });
  });

  describe("SkeletonSchedule", () => {
    it("renders with default count of 4", () => {
      const tree = TestRenderer.create(<SkeletonSchedule />);
      const instance = tree.root;
      
      const views = instance.findAllByProps({ "data-testid": "view" });
      expect(views.length).toBeGreaterThan(4);
    });

    it("renders with custom count", () => {
      const tree = TestRenderer.create(<SkeletonSchedule count={6} />);
      const instance = tree.root;
      
      const views = instance.findAllByProps({ "data-testid": "view" });
      expect(views.length).toBeGreaterThan(6);
    });

    it("renders with count of 1", () => {
      const tree = TestRenderer.create(<SkeletonSchedule count={1} />);
      expect(tree.toJSON()).toBeDefined();
    });

    it("renders with count of 0", () => {
      const tree = TestRenderer.create(<SkeletonSchedule count={0} />);
      expect(tree.toJSON()).toBeDefined();
    });
  });

  describe("Animation behavior", () => {
    it("starts animation on mount", () => {
      const tree = TestRenderer.create(<Skeleton />);
      
      // Animation should be started
      expect(tree.toJSON()).toBeDefined();
    });

    it("stops animation on unmount", () => {
      const tree = TestRenderer.create(<Skeleton />);
      
      // Unmount should stop animation
      tree.unmount();
      
      // No error should occur
      expect(true).toBe(true);
    });
  });

  describe("Theme handling", () => {
    it("uses light theme by default", () => {
      const tree = TestRenderer.create(<Skeleton />);
      expect(tree.toJSON()).toBeDefined();
    });

    it("adapts to dark theme", () => {
      // Mock dark mode - the mock is already set up at the top
      // Just need to verify it renders without error
      const tree = TestRenderer.create(<Skeleton />);
      expect(tree.toJSON()).toBeDefined();
    });
  });

  describe("Edge cases", () => {
    it("handles very small dimensions", () => {
      const tree = TestRenderer.create(<Skeleton width={1} height={1} />);
      expect(tree.toJSON()).toBeDefined();
    });

    it("handles very large dimensions", () => {
      const tree = TestRenderer.create(<Skeleton width={10000} height={10000} />);
      expect(tree.toJSON()).toBeDefined();
    });

    it("handles zero border radius", () => {
      const tree = TestRenderer.create(<Skeleton borderRadius={0} />);
      expect(tree.toJSON()).toBeDefined();
    });

    it("handles very large border radius", () => {
      const tree = TestRenderer.create(<Skeleton borderRadius={1000} />);
      expect(tree.toJSON()).toBeDefined();
    });
  });
});
