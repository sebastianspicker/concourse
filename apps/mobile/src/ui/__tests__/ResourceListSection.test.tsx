import { describe, expect, it, vi } from "vitest";
import TestRenderer from "react-test-renderer";
import React from "react";
import { ResourceListSection, ResourceListSectionProps } from "../ResourceListSection";

// Mock dependencies
vi.mock("../EmptyState", () => ({
  EmptyState: ({ message }: { message: string }) => (
    <div data-testid="empty-state">{message}</div>
  ),
}));

vi.mock("../ErrorState", () => ({
  ErrorState: ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
    <div data-testid="error-state" onClick={onRetry}>
      {message}
    </div>
  ),
}));

vi.mock("../Skeleton", () => ({
  SkeletonList: ({ count }: { count: number }) => (
    <div data-testid="skeleton-list">{`Loading ${count} items`}</div>
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

vi.mock("../ResourceListItem", () => ({
  ResourceListItem: <T,>({ item, renderCard, accessibilityLabel }: { 
    item: T; 
    renderCard: (item: T) => { title: string; subtitle?: string };
    accessibilityLabel: (item: T) => string;
  }) => (
    <div data-testid="list-item" aria-label={accessibilityLabel(item)}>
      {renderCard(item).title}
    </div>
  ),
}));

type TestItem = {
  id: string;
  name: string;
  description: string;
};

describe("ResourceListSection", () => {
  const defaultProps: ResourceListSectionProps<TestItem> = {
    title: "Test Items",
    loading: false,
    error: null,
    items: [],
    emptyMessage: "No items found",
    keyExtractor: (item) => item.id,
    href: (item) => ({ pathname: "/items/[id]", params: { id: item.id } }),
    renderCard: (item) => ({ title: item.name, subtitle: item.description }),
    accessibilityLabel: (item) => `Item: ${item.name}`,
  };

  const mockItems: TestItem[] = [
    { id: "1", name: "Item 1", description: "Description 1" },
    { id: "2", name: "Item 2", description: "Description 2" },
    { id: "3", name: "Item 3", description: "Description 3" },
  ];

  it("renders with items", () => {
    const props = { ...defaultProps, items: mockItems };
    const tree = TestRenderer.create(<ResourceListSection {...props} />);
    
    const instance = tree.root;
    const section = instance.findByProps({ "data-testid": "section" });
    
    expect(section.props.children[0].props.children).toBe("Test Items");
    
    // Should render list items
    const listItems = instance.findAllByProps({ "data-testid": "list-item" });
    expect(listItems).toHaveLength(3);
    
    // Should not show loading or error
    expect(() => instance.findByProps({ "data-testid": "skeleton-list" })).toThrow();
    expect(() => instance.findByProps({ "data-testid": "error-state" })).toThrow();
  });

  it("renders empty state when no items", () => {
    const props = { ...defaultProps, items: [] };
    const tree = TestRenderer.create(<ResourceListSection {...props} />);
    
    const instance = tree.root;
    const emptyState = instance.findByProps({ "data-testid": "empty-state" });
    
    expect(emptyState.props.children).toBe("No items found");
  });

  it("renders loading state", () => {
    const props = { ...defaultProps, loading: true };
    const tree = TestRenderer.create(<ResourceListSection {...props} />);
    
    const instance = tree.root;
    const skeleton = instance.findByProps({ "data-testid": "skeleton-list" });
    
    expect(skeleton.props.children).toContain("Loading 3 items");
    
    // Should not show items or empty state while loading
    expect(() => instance.findByProps({ "data-testid": "list-item" })).toThrow();
    expect(() => instance.findByProps({ "data-testid": "empty-state" })).toThrow();
  });

  it("renders error state", () => {
    const props = { ...defaultProps, error: "Failed to load items" };
    const tree = TestRenderer.create(<ResourceListSection {...props} />);
    
    const instance = tree.root;
    const errorState = instance.findByProps({ "data-testid": "error-state" });
    
    expect(errorState.props.children).toBe("Failed to load items");
    
    // Should not show items or loading when there's an error
    expect(() => instance.findByProps({ "data-testid": "list-item" })).toThrow();
    expect(() => instance.findByProps({ "data-testid": "skeleton-list" })).toThrow();
  });

  it("calls onRetry when error state retry is clicked", () => {
    const onRetry = vi.fn();
    const props = { ...defaultProps, error: "Failed to load", onRetry };
    const tree = TestRenderer.create(<ResourceListSection {...props} />);
    
    const instance = tree.root;
    const errorState = instance.findByProps({ "data-testid": "error-state" });
    
    // Simulate click on error state
    errorState.props.onClick();
    
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders with custom skeleton count", () => {
    const props = { 
      ...defaultProps, 
      loading: true,
    };
    const tree = TestRenderer.create(<ResourceListSection {...props} />);
    
    const instance = tree.root;
    const skeleton = instance.findByProps({ "data-testid": "skeleton-list" });
    
    // Default count is 3
    expect(skeleton.props.children).toContain("3");
  });

  it("renders section title correctly", () => {
    const props = { ...defaultProps, title: "Custom Title" };
    const tree = TestRenderer.create(<ResourceListSection {...props} />);
    
    const instance = tree.root;
    const section = instance.findByProps({ "data-testid": "section" });
    
    expect(section.props.children[0].props.children).toBe("Custom Title");
  });

  it("prioritizes loading state over error state", () => {
    const props = { ...defaultProps, loading: true, error: "Error message" };
    const tree = TestRenderer.create(<ResourceListSection {...props} />);
    
    const instance = tree.root;
    
    // Should show loading, not error
    expect(instance.findByProps({ "data-testid": "skeleton-list" })).toBeDefined();
    expect(() => instance.findByProps({ "data-testid": "error-state" })).toThrow();
  });

  it("prioritizes error state over empty state", () => {
    const props = { ...defaultProps, error: "Error message", items: [] };
    const tree = TestRenderer.create(<ResourceListSection {...props} />);
    
    const instance = tree.root;
    
    // Should show error, not empty state
    expect(instance.findByProps({ "data-testid": "error-state" })).toBeDefined();
    expect(() => instance.findByProps({ "data-testid": "empty-state" })).toThrow();
  });

  it("renders items with correct accessibility labels", () => {
    const props = { ...defaultProps, items: mockItems };
    const tree = TestRenderer.create(<ResourceListSection {...props} />);
    
    const instance = tree.root;
    const listItems = instance.findAllByProps({ "data-testid": "list-item" });
    
    expect(listItems[0].props["aria-label"]).toBe("Item: Item 1");
    expect(listItems[1].props["aria-label"]).toBe("Item: Item 2");
    expect(listItems[2].props["aria-label"]).toBe("Item: Item 3");
  });

  it("renders items with correct key extraction", () => {
    const props = { ...defaultProps, items: mockItems };
    const tree = TestRenderer.create(<ResourceListSection {...props} />);
    
    // Verify keys are correctly extracted
    const renderedKeys = tree.root.findAllByProps({ "data-testid": "list-item" });
    expect(renderedKeys).toHaveLength(3);
  });

  it("handles single item correctly", () => {
    const props = { ...defaultProps, items: [mockItems[0]] };
    const tree = TestRenderer.create(<ResourceListSection {...props} />);
    
    const instance = tree.root;
    const listItems = instance.findAllByProps({ "data-testid": "list-item" });
    
    expect(listItems).toHaveLength(1);
    expect(() => instance.findByProps({ "data-testid": "empty-state" })).toThrow();
  });

  it("handles many items correctly", () => {
    const manyItems = Array.from({ length: 100 }, (_, i) => ({
      id: `item-${i}`,
      name: `Item ${i}`,
      description: `Description ${i}`,
    }));
    
    const props = { ...defaultProps, items: manyItems };
    const tree = TestRenderer.create(<ResourceListSection {...props} />);
    
    const instance = tree.root;
    const listItems = instance.findAllByProps({ "data-testid": "list-item" });
    
    expect(listItems).toHaveLength(100);
  });

  it("renders correctly with all states false and empty items", () => {
    const props = { 
      ...defaultProps, 
      loading: false, 
      error: null, 
      items: [] 
    };
    const tree = TestRenderer.create(<ResourceListSection {...props} />);
    
    const instance = tree.root;
    
    // Should show empty state
    expect(instance.findByProps({ "data-testid": "empty-state" })).toBeDefined();
    
    // Should not show other states
    expect(() => instance.findByProps({ "data-testid": "skeleton-list" })).toThrow();
    expect(() => instance.findByProps({ "data-testid": "error-state" })).toThrow();
    expect(() => instance.findByProps({ "data-testid": "list-item" })).toThrow();
  });
});