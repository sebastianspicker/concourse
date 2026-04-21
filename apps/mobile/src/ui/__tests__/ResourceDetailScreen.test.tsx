import { describe, expect, it, vi } from "vitest";
import TestRenderer from "react-test-renderer";
import React from "react";
import { ResourceDetailScreen, ResourceDetailScreenProps } from "../ResourceDetailScreen";

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

// Mock react-native to avoid loading Flow-typed index.js through Vite SSR
vi.mock("react-native", () => ({
  StyleSheet: {
    create: (styles: Record<string, unknown>) => styles,
  },
  Text: ({ children, selectable, style }: {
    children: React.ReactNode;
    selectable?: boolean;
    style?: Record<string, unknown>;
  }) => (
    <span data-testid="text" data-selectable={selectable} style={style}>{children}</span>
  ),
  View: ({ children, style }: { children: React.ReactNode; style?: Record<string, unknown> }) => (
    <div data-testid="view" style={style}>{children}</div>
  ),
}));

// Mock dependencies
vi.mock("../Screen", () => ({
  Screen: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="screen">{children}</div>
  ),
}));

vi.mock("../Section", () => ({
  Section: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div data-testid="section">
      <h2>{title}</h2>
      {children}
    </div>
  ),
}));

vi.mock("../Card", () => ({
  Card: ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div data-testid="card">
      <h3>{title}</h3>
      {subtitle && <p>{subtitle}</p>}
    </div>
  ),
}));

vi.mock("../EmptyState", () => ({
  EmptyState: ({ message }: { message: string }) => (
    <div data-testid="empty-state">{message}</div>
  ),
}));

vi.mock("../ErrorState", () => ({
  ErrorState: ({ message, onRetry }: { message: string; errorType?: string; onRetry?: () => void }) => (
    <div data-testid="error-state">
      <span data-testid="error-message" data-selectable={true}>{message}</span>
      {onRetry && <button data-testid="retry-button" onClick={onRetry}>Retry</button>}
    </div>
  ),
}));

vi.mock("../Skeleton", () => ({
  SkeletonDetail: () => (
    <div data-testid="skeleton-detail">Loading...</div>
  ),
}));

type TestItem = {
  id: string;
  name: string;
  description: string;
  date: string;
};

describe("ResourceDetailScreen", () => {
  const mockItem: TestItem = {
    id: "1",
    name: "Test Item",
    description: "Test Description",
    date: "2024-01-15",
  };

  const defaultProps: ResourceDetailScreenProps<TestItem> = {
    title: "Item Details",
    loading: false,
    error: null,
    item: mockItem,
    notFoundMessage: "Item not found",
    cardTitle: "Test Item",
    cardSubtitle: "Test Description",
  };

  it("renders with data", () => {
    const tree = TestRenderer.create(<ResourceDetailScreen {...defaultProps} />);
    
    const instance = tree.root;
    
    // Should show section with title
    const section = instance.findByProps({ "data-testid": "section" });
    expect(section.props.children[0].props.children).toBe("Item Details");
    
    // Should show card with title and subtitle
    const card = instance.findByProps({ "data-testid": "card" });
    expect(card.props.children[0].props.children).toBe("Test Item");
    expect(card.props.children[1].props.children).toBe("Test Description");
    
    // Should not show loading, error, or empty state
    expect(() => instance.findByProps({ "data-testid": "skeleton-detail" })).toThrow();
    expect(() => instance.findByProps({ "data-testid": "empty-state" })).toThrow();
  });

  it("renders loading state", () => {
    const props = { ...defaultProps, loading: true, item: null };
    const tree = TestRenderer.create(<ResourceDetailScreen {...props} />);
    
    const instance = tree.root;
    
    // Should show loading block
    const loadingBlock = instance.findByProps({ "data-testid": "skeleton-detail" });
    expect(loadingBlock.props.children).toBe("Loading...");
    
    // Should not show empty state while loading
    expect(() => instance.findByProps({ "data-testid": "empty-state" })).toThrow();
  });

  it("renders error state", () => {
    const props = { ...defaultProps, error: "Failed to load item", item: null };
    const tree = TestRenderer.create(<ResourceDetailScreen {...props} />);

    const instance = tree.root;

    // Should show error state component
    const errorState = instance.findByProps({ "data-testid": "error-state" });
    expect(errorState).toBeDefined();
    const errorMessage = instance.findByProps({ "data-testid": "error-message" });
    expect(errorMessage.props.children).toBe("Failed to load item");

    // Should not show loading or empty state
    expect(() => instance.findByProps({ "data-testid": "skeleton-detail" })).toThrow();
    expect(() => instance.findByProps({ "data-testid": "empty-state" })).toThrow();
  });

  it("renders not found state when item is null", () => {
    const props = { ...defaultProps, item: null, loading: false, error: null };
    const tree = TestRenderer.create(<ResourceDetailScreen {...props} />);
    
    const instance = tree.root;
    
    // Should show empty state with not found message
    const emptyState = instance.findByProps({ "data-testid": "empty-state" });
    expect(emptyState.props.children).toBe("Item not found");
  });

  it("renders with renderMeta function", () => {
    const props = {
      ...defaultProps,
      renderMeta: () => (
        <div data-testid="meta-info">
          <span>Date: 2024-01-15</span>
        </div>
      ),
    };
    const tree = TestRenderer.create(<ResourceDetailScreen {...props} />);
    
    const instance = tree.root;
    
    // Should render meta info
    const metaInfo = instance.findByProps({ "data-testid": "meta-info" });
    expect(metaInfo).toBeDefined();
  });

  it("renders with footnote", () => {
    const props = {
      ...defaultProps,
      footnote: "Last updated: 2024-01-15",
    };
    const tree = TestRenderer.create(<ResourceDetailScreen {...props} />);
    
    const instance = tree.root;
    
    // Find footnote text (Text mock renders as span)
    const spans = instance.findAllByType("span");
    const footnoteElement = spans.find(el =>
      el.props.children === "Last updated: 2024-01-15"
    );
    expect(footnoteElement).toBeDefined();
  });

  it("renders card without subtitle", () => {
    const props = { ...defaultProps, cardSubtitle: undefined };
    const tree = TestRenderer.create(<ResourceDetailScreen {...props} />);
    
    const instance = tree.root;
    const card = instance.findByProps({ "data-testid": "card" });
    
    // Card should still render with title
    expect(card.props.children[0].props.children).toBe("Test Item");
  });

  it("prioritizes loading state over error state", () => {
    const props = { 
      ...defaultProps, 
      loading: true, 
      error: "Error message", 
      item: null 
    };
    const tree = TestRenderer.create(<ResourceDetailScreen {...props} />);
    
    const instance = tree.root;
    
    // Should show loading, not error
    const loadingBlock = instance.findByProps({ "data-testid": "skeleton-detail" });
    expect(loadingBlock).toBeDefined();
  });

  it("hides card and shows empty state when item is null", () => {
    const props = { ...defaultProps, item: null, loading: false, error: null };
    const tree = TestRenderer.create(<ResourceDetailScreen {...props} />);

    const instance = tree.root;

    // Card should not render when item is null
    expect(() => instance.findByProps({ "data-testid": "card" })).toThrow();

    // Empty state should show
    const emptyState = instance.findByProps({ "data-testid": "empty-state" });
    expect(emptyState).toBeDefined();
  });

  it("renders with custom title", () => {
    const props = { ...defaultProps, title: "Custom Title" };
    const tree = TestRenderer.create(<ResourceDetailScreen {...props} />);
    
    const instance = tree.root;
    const section = instance.findByProps({ "data-testid": "section" });
    
    expect(section.props.children[0].props.children).toBe("Custom Title");
  });

  it("renders with custom not found message", () => {
    const props = { 
      ...defaultProps, 
      item: null, 
      notFoundMessage: "This item does not exist" 
    };
    const tree = TestRenderer.create(<ResourceDetailScreen {...props} />);
    
    const instance = tree.root;
    const emptyState = instance.findByProps({ "data-testid": "empty-state" });
    
    expect(emptyState.props.children).toBe("This item does not exist");
  });

  it("handles complex renderMeta", () => {
    const props = {
      ...defaultProps,
      renderMeta: () => (
        <div data-testid="complex-meta">
          <div data-testid="meta-row">Date: 2024-01-15</div>
          <div data-testid="meta-row">Location: Room 101</div>
          <div data-testid="meta-row">Status: Active</div>
        </div>
      ),
    };
    const tree = TestRenderer.create(<ResourceDetailScreen {...props} />);
    
    const instance = tree.root;
    
    const complexMeta = instance.findByProps({ "data-testid": "complex-meta" });
    expect(complexMeta).toBeDefined();
    
    const metaRows = instance.findAllByProps({ "data-testid": "meta-row" });
    expect(metaRows).toHaveLength(3);
  });

  it("does not render meta when item is null", () => {
    const props = {
      ...defaultProps,
      item: null,
      renderMeta: () => <div data-testid="meta-info">Meta</div>,
    };
    const tree = TestRenderer.create(<ResourceDetailScreen {...props} />);
    
    const instance = tree.root;
    
    // Meta should not render when item is null
    expect(() => instance.findByProps({ "data-testid": "meta-info" })).toThrow();
  });

  it("renders correctly with all optional props", () => {
    const props = {
      ...defaultProps,
      cardSubtitle: "Optional Subtitle",
      renderMeta: () => <div data-testid="meta">Meta Info</div>,
      footnote: "Optional Footnote",
    };
    const tree = TestRenderer.create(<ResourceDetailScreen {...props} />);
    
    const instance = tree.root;
    
    // All elements should be present
    expect(instance.findByProps({ "data-testid": "card" })).toBeDefined();
    expect(instance.findByProps({ "data-testid": "meta" })).toBeDefined();
  });

  it("renders correctly with minimal props", () => {
    const minimalProps: ResourceDetailScreenProps<TestItem> = {
      title: "Minimal",
      loading: false,
      error: null,
      item: mockItem,
      notFoundMessage: "Not found",
      cardTitle: "Title",
    };
    const tree = TestRenderer.create(<ResourceDetailScreen {...minimalProps} />);
    
    const instance = tree.root;
    
    // Should still render essential elements
    expect(instance.findByProps({ "data-testid": "section" })).toBeDefined();
    expect(instance.findByProps({ "data-testid": "card" })).toBeDefined();
  });
});
