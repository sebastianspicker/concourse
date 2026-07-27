/** Verifies freshness copy appears only for valid resource update timestamps. */
import React from "react";
import TestRenderer from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { FreshnessIndicator } from "../FreshnessIndicator";

vi.mock("../ThemeContext", () => ({ useTheme: () => ({ colors: { accent: "#176B87", muted: "#5C6B75" } }) }));
vi.mock("../../i18n/LocaleContext", () => ({
  useLocale: () => ({ locale: "en", t: (_key: string, values: { age: string }) => `Current · ${values.age}` }),
}));
vi.mock("react-native", () => ({
  Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  View: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  StyleSheet: { create: (styles: object) => styles },
}));

describe("FreshnessIndicator", () => {
  it("stays absent until a resource has a verified update time", () => {
    const tree = TestRenderer.create(<FreshnessIndicator updatedAt={null} />);
    expect(tree.toJSON()).toBeNull();
  });

  it("renders localized current-data age", () => {
    vi.spyOn(Date, "now").mockReturnValue(120_000);
    const tree = TestRenderer.create(<FreshnessIndicator updatedAt={0} />);
    expect(tree.root.findByType("span").props.children).toContain("2 minutes ago");
    vi.restoreAllMocks();
  });
});
