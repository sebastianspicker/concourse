import React from "react";
import TestRenderer from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { ResourceList } from "../ResourceList";

vi.mock("../ThemeContext", () => ({ useTheme: () => ({ colors: { background: "#fff", border: "#ddd" } }) }));
vi.mock("../ResourceListItem", () => ({ ResourceListItem: ({ item }: { item: { id: string } }) => <span>{item.id}</span> }));
vi.mock("../Skeleton", () => ({ SkeletonList: () => <span>loading</span> }));
vi.mock("../ErrorState", () => ({ ErrorState: () => <span>error</span> }));
vi.mock("../EmptyState", () => ({ EmptyState: () => <span>empty</span> }));
vi.mock("react-native", () => ({
  FlatList: (props: { data: Array<{ id: string }>; renderItem: (value: { item: { id: string } }) => React.ReactNode; initialNumToRender: number; maxToRenderPerBatch: number; windowSize: number }) => (
    <div data-testid="flat-list" data-count={props.data.length} data-initial={props.initialNumToRender} data-batch={props.maxToRenderPerBatch} data-window={props.windowSize}>
      {props.data.slice(0, props.initialNumToRender).map((item) => <React.Fragment key={item.id}>{props.renderItem({ item })}</React.Fragment>)}
    </div>
  ),
  View: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  StyleSheet: { create: (styles: object) => styles, hairlineWidth: 1 },
}));

describe("ResourceList virtualization", () => {
  it("keeps a 1,000-row fixture on a bounded render window", () => {
    const items = Array.from({ length: 1000 }, (_, index) => ({ id: String(index) }));
    const tree = TestRenderer.create(
      <ResourceList
        items={items}
        loading={false}
        error={null}
        refreshing={false}
        onRefresh={() => undefined}
        keyExtractor={(item) => item.id}
        href={(item) => ({ pathname: "/events/[id]", params: { id: item.id } })}
        renderCard={(item) => ({ title: item.id })}
        accessibilityLabel={(item) => item.id}
        emptyMessage="empty"
      />
    );
    const list = tree.root.findByProps({ "data-testid": "flat-list" });
    expect(list.props["data-count"]).toBe(1000);
    expect(list.props["data-initial"]).toBe(10);
    expect(list.props["data-batch"]).toBe(10);
    expect(list.props["data-window"]).toBe(7);
    expect(tree.root.findAllByType("span")).toHaveLength(10);
  });
});
