import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider, useTheme, useThemePreference } from "../ThemeContext";

const getItem = vi.fn<() => Promise<string | null>>();
const setItem = vi.fn<() => Promise<void>>();
const useColorScheme = vi.fn<() => "light" | "dark">();

vi.mock("react-native", () => ({ useColorScheme: () => useColorScheme() }));
vi.mock("@react-native-async-storage/async-storage", () => ({ default: { getItem: () => getItem(), setItem: () => setItem() } }));

function Probe(): React.JSX.Element {
  const theme = useTheme();
  const preference = useThemePreference();
  return (
    <div>
      <span data-testid="preference">{preference.preference}</span>
      <span data-testid="scheme">{theme.colorScheme}</span>
      <button data-testid="high" onClick={() => void preference.setPreference("highContrast")} />
      <button data-testid="toggle" onClick={preference.toggleTheme} />
    </div>
  );
}

async function render(): Promise<TestRenderer.ReactTestRenderer> {
  const tree = TestRenderer.create(<ThemeProvider><Probe /></ThemeProvider>);
  await act(async () => { await Promise.resolve(); });
  return tree;
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    getItem.mockResolvedValue(null);
    setItem.mockResolvedValue(undefined);
    useColorScheme.mockReturnValue("light");
  });
  afterEach(() => vi.clearAllMocks());

  it("defaults to system appearance", async () => {
    const tree = await render();
    expect(tree.root.findByProps({ "data-testid": "preference" }).props.children).toBe("system");
    expect(tree.root.findByProps({ "data-testid": "scheme" }).props.children).toBe("light");
  });

  it("loads the persisted high-contrast preference", async () => {
    getItem.mockResolvedValue("highContrast");
    const tree = await render();
    expect(tree.root.findByProps({ "data-testid": "scheme" }).props.children).toBe("highContrast");
  });

  it("persists an explicit preference", async () => {
    const tree = await render();
    await act(async () => { tree.root.findByProps({ "data-testid": "high" }).props.onClick(); await Promise.resolve(); });
    expect(tree.root.findByProps({ "data-testid": "scheme" }).props.children).toBe("highContrast");
    expect(setItem).toHaveBeenCalled();
  });

  it("toggles from the resolved system scheme", async () => {
    const tree = await render();
    act(() => tree.root.findByProps({ "data-testid": "toggle" }).props.onClick());
    expect(tree.root.findByProps({ "data-testid": "scheme" }).props.children).toBe("dark");
  });
});
