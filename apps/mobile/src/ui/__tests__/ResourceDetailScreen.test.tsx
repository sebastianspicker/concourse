/** Verifies detail screens distinguish loading, missing, degraded, and recoverable failure states. */
import type { ReactNode } from "react";
import TestRenderer from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { ResourceDetailScreen } from "../ResourceDetailScreen";

vi.mock("../ThemeContext", () => ({
  useTheme: () => ({
    colors: { text: "#17202A", muted: "#5C6873", border: "#D7DEE3", surface: "#fff" },
    ui: { borderWidth: 1 },
    designPreset: "wayfinding",
  }),
}));
vi.mock("../Screen", () => ({ Screen: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock("../useHydratedWindowWidth", () => ({ useHydratedWindowWidth: () => 1024 }));
vi.mock("../Skeleton", () => ({ SkeletonDetail: () => <div data-testid="loading" /> }));
vi.mock("../StatusBanner", () => ({ StatusBanner: ({ kind }: { kind: string }) => <div data-testid={`status-${kind}`} /> }));
vi.mock("../ErrorState", () => ({ ErrorState: () => <div data-testid="error" /> }));
vi.mock("../EmptyState", () => ({ EmptyState: ({ message }: { message: string }) => <div data-testid="empty">{message}</div> }));
vi.mock("react-native", () => ({
  Text: ({ children, accessibilityRole }: { children: ReactNode; accessibilityRole?: string }) => <span role={accessibilityRole}>{children}</span>,
  View: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  StyleSheet: { create: (styles: object) => styles },
}));

const base = {
  error: null,
  notFoundMessage: "Missing",
  cardTitle: "Public event",
};

describe("ResourceDetailScreen", () => {
  it("renders a flat detail heading and metadata", () => {
    const tree = TestRenderer.create(<ResourceDetailScreen {...base} loading={false} item={{ id: "1" }} cardSubtitle="Today" renderMeta={() => <span>Metadata</span>} />);
    const copy = tree.root.findAllByType("span").map((node) => node.props.children).join(" ");
    expect(copy).toContain("Public event");
    expect(copy).toContain("Metadata");
  });

  it("renders loading, error, and missing states deterministically", () => {
    expect(TestRenderer.create(<ResourceDetailScreen {...base} loading item={null} />).root.findByProps({ "data-testid": "loading" })).toBeDefined();
    expect(TestRenderer.create(<ResourceDetailScreen {...base} loading={false} error="failed" item={null} />).root.findByProps({ "data-testid": "error" })).toBeDefined();
    expect(TestRenderer.create(<ResourceDetailScreen {...base} loading={false} item={null} />).root.findByProps({ "data-testid": "empty" }).props.children).toBe("Missing");
  });

  it("keeps a valid item visible while disclosing a background refresh error", () => {
    const tree = TestRenderer.create(<ResourceDetailScreen {...base} loading error="failed" item={{ id: "1" }} />);
    expect(tree.root.findAllByProps({ "data-testid": "loading" })).toHaveLength(0);
    expect(tree.root.findAllByProps({ "data-testid": "error" })).toHaveLength(0);
    expect(tree.root.findByProps({ "data-testid": "status-degraded" })).toBeDefined();
    expect(tree.root.findAllByType("span").map((node) => node.props.children).join(" ")).toContain("Public event");
  });

  it("discloses when a visible detail comes from saved data", () => {
    const tree = TestRenderer.create(<ResourceDetailScreen {...base} loading={false} item={{ id: "1" }} cached cacheAge={60_000} />);
    expect(tree.root.findByProps({ "data-testid": "status-cached" })).toBeDefined();
  });

  it("keeps saved age and degraded status visible together", () => {
    const tree = TestRenderer.create(
      <ResourceDetailScreen {...base} loading={false} error="failed" item={{ id: "1" }} cached cacheAge={60_000} />
    );
    expect(tree.root.findByProps({ "data-testid": "status-cached" })).toBeDefined();
    expect(tree.root.findByProps({ "data-testid": "status-degraded" })).toBeDefined();
  });
});
