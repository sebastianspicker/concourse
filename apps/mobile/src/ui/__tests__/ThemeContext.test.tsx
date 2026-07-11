import { expect, it, vi, beforeEach, afterEach } from "vitest";
import TestRenderer, { act } from "react-test-renderer";
import React from "react";
import {
  ThemeProvider,
  useTheme,
  useThemePreference,
  useThemeColors,
  useThemeUi,
  useIsDarkMode,
  type ThemePreference,
} from "../ThemeContext";

const mockUseColorScheme = vi.fn().mockReturnValue("light");

vi.mock("react-native", () => ({
  useColorScheme: () => mockUseColorScheme(),
}));

const mockGetItem = vi.fn().mockResolvedValue(null);
const mockSetItem = vi.fn().mockResolvedValue(undefined);

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: (...args: Parameters<typeof mockGetItem>) => mockGetItem(...args),
    setItem: (...args: Parameters<typeof mockSetItem>) => mockSetItem(...args),
  },
}));

function TestComponent(): JSX.Element {
  const theme = useTheme();
  const { preference, setPreference, toggleTheme } = useThemePreference();
  const colors = useThemeColors();
  const ui = useThemeUi();
  const isDark = useIsDarkMode();

  return (
    <div>
      <span data-testid="is-dark">{isDark.toString()}</span>
      <span data-testid="preference">{preference}</span>
      <span data-testid="color-scheme">{theme.colorScheme}</span>
      <span data-testid="background-color">{colors.background}</span>
      <span data-testid="font-scale">{ui.fontScale}</span>
      <button data-testid="toggle" onClick={toggleTheme}>Toggle</button>
      <button data-testid="set-light" onClick={() => setPreference("light")}>Light</button>
      <button data-testid="set-dark" onClick={() => setPreference("dark")}>Dark</button>
      <button data-testid="set-system" onClick={() => setPreference("system")}>System</button>
      <button data-testid="set-accessibility" onClick={() => setPreference("accessibility")}>Accessibility</button>
    </div>
  );
}

async function flushAsync(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseColorScheme.mockReturnValue("light");
  mockGetItem.mockResolvedValue(null);
  mockSetItem.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

  it("defaults to dark preference after loading", async () => {
    const tree = TestRenderer.create(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await flushAsync();

    const instance = tree.root;
    expect(instance.findByProps({ "data-testid": "preference" }).props.children).toBe("dark");
    expect(instance.findByProps({ "data-testid": "color-scheme" }).props.children).toBe("dark");
    expect(instance.findByProps({ "data-testid": "is-dark" }).props.children).toBe("true");
  });

  it("uses dark fallback during initial async load", () => {
    mockGetItem.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(null), 100))
    );

    const tree = TestRenderer.create(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const instance = tree.root;
    expect(instance.findByProps({ "data-testid": "color-scheme" }).props.children).toBe("dark");
    expect(instance.findByProps({ "data-testid": "background-color" }).props.children).toBe("#000000");
  });

  it("loads saved accessibility preference", async () => {
    mockGetItem.mockResolvedValue("accessibility");

    const tree = TestRenderer.create(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await flushAsync();

    const instance = tree.root;
    expect(instance.findByProps({ "data-testid": "preference" }).props.children).toBe("accessibility");
    expect(instance.findByProps({ "data-testid": "color-scheme" }).props.children).toBe("accessibility");
    expect(instance.findByProps({ "data-testid": "font-scale" }).props.children).toBe(1.15);
  });

  it("ignores invalid saved preference and keeps dark default", async () => {
    mockGetItem.mockResolvedValue("invalid");

    const tree = TestRenderer.create(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await flushAsync();

    const instance = tree.root;
    expect(instance.findByProps({ "data-testid": "preference" }).props.children).toBe("dark");
  });

  it("resolves system preference using system light mode", async () => {
    mockGetItem.mockResolvedValue("system");
    mockUseColorScheme.mockReturnValue("light");

    const tree = TestRenderer.create(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await flushAsync();

    const instance = tree.root;
    expect(instance.findByProps({ "data-testid": "preference" }).props.children).toBe("system");
    expect(instance.findByProps({ "data-testid": "color-scheme" }).props.children).toBe("light");
    expect(instance.findByProps({ "data-testid": "is-dark" }).props.children).toBe("false");
  });

  it("resolves system preference using system dark mode", async () => {
    mockGetItem.mockResolvedValue("system");
    mockUseColorScheme.mockReturnValue("dark");

    const tree = TestRenderer.create(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await flushAsync();

    const instance = tree.root;
    expect(instance.findByProps({ "data-testid": "color-scheme" }).props.children).toBe("dark");
    expect(instance.findByProps({ "data-testid": "is-dark" }).props.children).toBe("true");
  });

  it("setPreference stores accessibility selection", async () => {
    const tree = TestRenderer.create(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await flushAsync();

    const instance = tree.root;
    const button = instance.findByProps({ "data-testid": "set-accessibility" });

    await act(async () => {
      button.props.onClick();
    });

    expect(instance.findByProps({ "data-testid": "preference" }).props.children).toBe("accessibility");
    expect(instance.findByProps({ "data-testid": "color-scheme" }).props.children).toBe("accessibility");
    expect(mockSetItem).toHaveBeenCalledWith("@campus-app/theme-preference", "accessibility");
  });

  it("toggleTheme switches dark to light", async () => {
    const tree = TestRenderer.create(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await flushAsync();

    const instance = tree.root;
    const toggle = instance.findByProps({ "data-testid": "toggle" });

    await act(async () => {
      toggle.props.onClick();
    });

    expect(instance.findByProps({ "data-testid": "preference" }).props.children).toBe("light");
    expect(instance.findByProps({ "data-testid": "color-scheme" }).props.children).toBe("light");
  });

  it("toggleTheme switches light to dark", async () => {
    const tree = TestRenderer.create(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await flushAsync();

    const instance = tree.root;
    const setLight = instance.findByProps({ "data-testid": "set-light" });
    const toggle = instance.findByProps({ "data-testid": "toggle" });

    await act(async () => {
      setLight.props.onClick();
    });

    await act(async () => {
      toggle.props.onClick();
    });

    expect(instance.findByProps({ "data-testid": "preference" }).props.children).toBe("dark");
    expect(instance.findByProps({ "data-testid": "color-scheme" }).props.children).toBe("dark");
  });

  it("throws when hooks are used outside provider", () => {
    const originalError = console.error;
    console.error = vi.fn();

    expect(() => {
      TestRenderer.create(<TestComponent />);
    }).toThrow("useTheme must be used within a ThemeProvider");

    console.error = originalError;
  });

  it("setPreference returns a Promise", async () => {
    let capturedSetPreference: ((p: ThemePreference) => Promise<void>) | undefined;

    function CaptureComponent(): JSX.Element {
      const { setPreference: sp } = useThemePreference();
      capturedSetPreference = sp;
      return <div />;
    }

    await act(async () => {
      TestRenderer.create(
        <ThemeProvider>
          <CaptureComponent />
        </ThemeProvider>
      );
    });

    await flushAsync();

    expect(capturedSetPreference).toBeDefined();
    const result = capturedSetPreference!("light");
    expect(result).toBeInstanceOf(Promise);
    await result;
    expect(mockSetItem).toHaveBeenCalledWith("@campus-app/theme-preference", "light");
  });

  it("setPreference calls AsyncStorage.setItem with the chosen preference", async () => {
    let capturedSetPreference: ((p: ThemePreference) => Promise<void>) | undefined;

    function CaptureComponent(): JSX.Element {
      const { setPreference: sp } = useThemePreference();
      capturedSetPreference = sp;
      return <div />;
    }

    TestRenderer.create(
      <ThemeProvider>
        <CaptureComponent />
      </ThemeProvider>
    );

    await flushAsync();

    await act(async () => {
      await capturedSetPreference!("accessibility");
    });

    expect(mockSetItem).toHaveBeenCalledWith(
      "@campus-app/theme-preference",
      "accessibility"
    );
  });
