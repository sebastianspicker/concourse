/** Verifies list-item activation preserves selection before navigating to details. */
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ResourceListItem } from "../ResourceListItem";

vi.mock("expo-router", () => ({
  Link: ({ children, onPress }: { children: React.ReactNode; onPress?: (event: { preventDefault: () => void }) => void }) => (
    <a data-testid="resource-link" onClick={(event) => onPress?.(event)}>{children}</a>
  )
}));
vi.mock("@expo/vector-icons/MaterialIcons", () => ({
  default: ({ testID }: { testID?: string }) => <span data-testid={testID}>icon</span>
}));
vi.mock("../ThemeContext", () => ({
  useTheme: () => ({
    colors: {
      accent: "#000",
      border: "#ddd",
      infoSurface: "#eee",
      muted: "#666",
      signal: "#FFBE0B",
      signalText: "#3E2B00",
      surface: "#fff",
      text: "#111",
    },
    designPreset: "wayfinding",
    ui: { borderWidth: 1 }
  })
}));
vi.mock("../../i18n/LocaleContext", () => ({
  useLocale: () => ({ locale: "en", t: (key: string) => (key === "nextUp" ? "Next up" : key) }),
}));
vi.mock("react-native", () => ({
  Pressable: ({ children, style }: { children: React.ReactNode | ((state: { pressed: boolean }) => React.ReactNode); style?: React.CSSProperties }) => (
    <button style={style}>{typeof children === "function" ? children({ pressed: false }) : children}</button>
  ),
  Text: ({ children, testID }: { children: React.ReactNode; testID?: string }) => (
    <span data-testid={testID}>{children}</span>
  ),
  View: ({ children, style, testID }: { children: React.ReactNode; style?: React.CSSProperties; testID?: string }) => (
    <div data-testid={testID} style={style}>{children}</div>
  ),
  StyleSheet: { create: (styles: object) => styles, hairlineWidth: 1 }
}));

afterEach(() => vi.useRealTimers());

describe("ResourceListItem navigation handoff", () => {
  it("keeps the slotted press target style static and row geometry horizontal", () => {
    const tree = TestRenderer.create(
      <ResourceListItem
        item={{ id: "event-1" }}
        href={(entry) => ({ pathname: "/events/[id]", params: { id: entry.id } })}
        renderCard={() => ({ title: "Event", subtitle: "Tomorrow" })}
        accessibilityLabel={() => "Event"}
      />
    );

    const pressTarget = tree.root.findByType("button");
    expect(pressTarget.props.style).toEqual({ width: "100%" });

    const row = tree.root.findByProps({ "data-testid": "resource-row" });
    expect(row.props.style).toContainEqual(
      expect.objectContaining({ flexDirection: "row", alignItems: "center" })
    );
    expect(row.props.style).toContainEqual(
      expect.objectContaining({ minHeight: 76, borderBottomWidth: 1 })
    );
    expect(tree.root.findByProps({ "data-testid": "resource-row-copy" })).toBeTruthy();
    expect(tree.root.findByProps({ "data-testid": "resource-row-chevron" })).toBeTruthy();
  });

  it("stores an accepted item once while suppressing a duplicate press", () => {
    vi.useFakeTimers();
    const item = { id: "event-1" };
    const onNavigate = vi.fn();
    const tree = TestRenderer.create(
      <ResourceListItem
        item={item}
        href={(entry) => ({ pathname: "/events/[id]", params: { id: entry.id } })}
        renderCard={() => ({ title: "Event" })}
        accessibilityLabel={() => "Event"}
        onNavigate={onNavigate}
      />
    );
    const link = tree.root.findByProps({ "data-testid": "resource-link" });

    const firstPress = { preventDefault: vi.fn() };
    act(() => link.props.onClick(firstPress));
    expect(onNavigate).toHaveBeenCalledOnce();
    expect(onNavigate).toHaveBeenLastCalledWith(item);
    expect(firstPress.preventDefault).not.toHaveBeenCalled();

    const duplicatePress = { preventDefault: vi.fn() };
    act(() => link.props.onClick(duplicatePress));
    expect(onNavigate).toHaveBeenCalledOnce();
    expect(duplicatePress.preventDefault).toHaveBeenCalledOnce();

    act(() => { vi.advanceTimersByTime(500); });
    act(() => link.props.onClick({ preventDefault: vi.fn() }));
    expect(onNavigate).toHaveBeenCalledTimes(2);
  });
});

describe("ResourceListItem timeline spine", () => {
  const timelineProps = {
    item: { id: "sched-1" },
    href: (entry: { id: string }) => ({ pathname: "/schedule/[id]", params: { id: entry.id } }),
    accessibilityLabel: () => "Campus orientation",
  };

  it("renders time rail, spine dot, and no heavy time-column rule", () => {
    const tree = TestRenderer.create(
      <ResourceListItem
        {...timelineProps}
        variant="timeline"
        renderCard={() => ({
          title: "Campus orientation",
          subtitle: "Auditorium",
          leading: "10:00",
        })}
      />
    );

    expect(tree.root.findByProps({ "data-testid": "resource-timeline-time" })).toBeTruthy();
    expect(tree.root.findByProps({ "data-testid": "resource-spine-dot" })).toBeTruthy();
    expect(tree.root.findByProps({ "data-testid": "resource-row-copy" })).toBeTruthy();
    expect(tree.root.findByProps({ "data-testid": "resource-row-chevron" })).toBeTruthy();

    const timeCol = tree.root.findByProps({ "data-testid": "resource-timeline-time" });
    const timeStyle = Array.isArray(timeCol.props.style) ? Object.assign({}, ...timeCol.props.style) : timeCol.props.style;
    expect(timeStyle?.borderRightWidth).toBeUndefined();
  });

  it("washes the active row, fills the spine, and shows Next up by default", () => {
    const tree = TestRenderer.create(
      <ResourceListItem
        {...timelineProps}
        variant="timeline"
        active
        renderCard={() => ({
          title: "Campus orientation",
          subtitle: "Auditorium",
          leading: "10:00",
        })}
      />
    );

    const row = tree.root.findByProps({ "data-testid": "resource-row" });
    const rowStyle = Array.isArray(row.props.style)
      ? Object.assign({}, ...row.props.style.flatMap((entry: unknown) => (Array.isArray(entry) ? entry : [entry])))
      : row.props.style;
    expect(rowStyle.backgroundColor).toMatch(/rgba\(255,\s*190,\s*11,\s*0\.18\)/);

    const badge = tree.root.findByProps({ "data-testid": "resource-row-badge" });
    expect(badge.children).toContain("Next up");
  });

  it("prefers an explicit content badge over the default next label", () => {
    const tree = TestRenderer.create(
      <ResourceListItem
        {...timelineProps}
        variant="timeline"
        active
        renderCard={() => ({
          title: "Campus orientation",
          leading: "10:00",
          badge: "Live",
        })}
      />
    );

    const badge = tree.root.findByProps({ "data-testid": "resource-row-badge" });
    expect(badge.children).toContain("Live");
  });

  it("omits the default next badge when inactive", () => {
    const tree = TestRenderer.create(
      <ResourceListItem
        {...timelineProps}
        variant="timeline"
        active={false}
        renderCard={() => ({
          title: "Welcome session",
          leading: "12:00",
        })}
      />
    );

    expect(tree.root.findAllByProps({ "data-testid": "resource-row-badge" })).toHaveLength(0);
  });

  it("does not render a spine on standard rows", () => {
    const tree = TestRenderer.create(
      <ResourceListItem
        {...timelineProps}
        variant="standard"
        renderCard={() => ({ title: "Event" })}
      />
    );

    expect(tree.root.findAllByProps({ "data-testid": "resource-spine-dot" })).toHaveLength(0);
    expect(tree.root.findAllByProps({ "data-testid": "resource-timeline-time" })).toHaveLength(0);
  });
});
