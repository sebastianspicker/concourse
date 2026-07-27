/** Verifies Today distinguishes unavailable schedule data from cached or fresh resource states. */
import React from "react";
import TestRenderer from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";

const screenState = vi.hoisted(() => ({ scheduleDegraded: false }));

vi.mock("react-native", () => ({
  StyleSheet: { create: (styles: object) => styles },
  Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  View: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useWindowDimensions: () => ({ width: 390 })
}));
vi.mock("@/components/DegradedBanner", () => ({
  DegradedBanner: ({ visible }: { visible: boolean }) => visible ? <div data-testid="degraded-banner" /> : null
}));
vi.mock("@/hooks/useToday", () => ({
  useToday: () => ({ data: { events: [], rooms: [] }, source: "network", cacheAge: null, loading: false, refreshing: false, error: null, refresh: vi.fn() })
}));
vi.mock("@/hooks/useSchedule", () => ({
  useSchedule: () => ({ data: { schedule: [], _degraded: screenState.scheduleDegraded }, source: "network", cacheAge: null, loading: false, refreshing: false, error: null, refresh: vi.fn() })
}));
vi.mock("@/i18n/LocaleContext", () => ({ useLocale: () => ({ locale: "en", t: (key: string) => key }) }));
vi.mock("@/config/institution", () => ({ getInstitutionTimeZone: () => "Europe/Berlin" }));
vi.mock("@/ui/Screen", () => ({ Screen: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock("@/ui/StatusBanner", () => ({ StatusBanner: () => <div data-testid="cached-banner" /> }));
vi.mock("@/ui/ThemeContext", () => ({
  useTheme: () => ({
    colors: {
      text: "#000",
      muted: "#666",
      border: "#ccc",
      surface: "#fff",
      signal: "#E8A800",
      signalText: "#3A2A00",
      inverseSurface: "#0B1424",
      inverseText: "#fff",
      success: "#176B45",
      successSurface: "#EDF8F1",
      warning: "#765100",
      warningSurface: "#FFF5D7",
      error: "#B42318",
      errorSurface: "#FFF1F0",
    },
  }),
}));
vi.mock("@/components/ChromeStatusContext", () => ({
  useSetChromeStatus: () => vi.fn(),
}));
vi.mock("expo-router", () => ({
  useFocusEffect: (effect: () => void | (() => void)) => {
    const cleanup = effect();
    return typeof cleanup === "function" ? cleanup : undefined;
  },
}));
vi.mock("@/screens/todayEventsSection", () => ({ TodayEventsSection: () => <div /> }));
vi.mock("@/screens/todayScheduleSection", () => ({ ScheduleSection: () => <div /> }));

import TodayScreen from "../../../app/(tabs)/index";

describe("TodayScreen schedule degradation status", () => {
  it("shows the schedule degradation banner only for degraded schedule data", () => {
    screenState.scheduleDegraded = true;
    const degraded = TestRenderer.create(<TodayScreen />);
    expect(degraded.root.findAllByProps({ "data-testid": "degraded-banner" })).toHaveLength(1);

    screenState.scheduleDegraded = false;
    const complete = TestRenderer.create(<TodayScreen />);
    expect(complete.root.findAllByProps({ "data-testid": "degraded-banner" })).toHaveLength(0);
  });
});
