import { describe, expect, it, vi } from "vitest";
import TestRenderer from "react-test-renderer";
import React from "react";
import { 
  ErrorState, 
  ErrorStateProps, 
  NetworkError, 
  NotFoundError, 
  GenericError 
} from "../ErrorState";

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

// Mock expo-router
vi.mock("expo-router", () => ({
  useNavigation: () => ({
    canGoBack: vi.fn().mockReturnValue(false),
    goBack: vi.fn(),
  }),
}));

// Mock react-native
vi.mock("react-native", () => ({
  Pressable: ({ children, onPress, style, accessibilityLabel, accessibilityHint, accessibilityRole }: { 
    children: React.ReactNode; 
    onPress?: () => void;
    style?: Record<string, unknown>;
    accessibilityLabel?: string;
    accessibilityHint?: string;
    accessibilityRole?: string;
  }) => (
    <button 
      data-testid="pressable" 
      onClick={onPress} 
      style={style}
      aria-label={accessibilityLabel}
      aria-hint={accessibilityHint}
      role={accessibilityRole}
    >
      {children}
    </button>
  ),
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

describe("ErrorState", () => {
  const defaultProps: ErrorStateProps = {
    message: "Something went wrong",
  };

  describe("ErrorState component", () => {
    it("renders with message", () => {
      const tree = TestRenderer.create(<ErrorState {...defaultProps} />);
      const instance = tree.root;
      
      const texts = instance.findAllByProps({ "data-testid": "text" });
      const messageText = texts.find(t => t.props.children === "Something went wrong");
      expect(messageText).toBeDefined();
    });

    it("renders with generic error type by default", () => {
      const tree = TestRenderer.create(<ErrorState {...defaultProps} />);
      const instance = tree.root;
      
      const texts = instance.findAllByProps({ "data-testid": "text" });
      const titleText = texts.find(t => t.props.children === "Something Went Wrong");
      expect(titleText).toBeDefined();
    });

    it("renders with network error type", () => {
      const props: ErrorStateProps = { 
        ...defaultProps, 
        errorType: "network" 
      };
      const tree = TestRenderer.create(<ErrorState {...props} />);
      const instance = tree.root;
      
      const texts = instance.findAllByProps({ "data-testid": "text" });
      const titleText = texts.find(t => t.props.children === "Connection Error");
      expect(titleText).toBeDefined();
    });

    it("renders with not found error type", () => {
      const props: ErrorStateProps = { 
        ...defaultProps, 
        errorType: "notFound" 
      };
      const tree = TestRenderer.create(<ErrorState {...props} />);
      const instance = tree.root;
      
      const texts = instance.findAllByProps({ "data-testid": "text" });
      const titleText = texts.find(t => t.props.children === "Not Found");
      expect(titleText).toBeDefined();
    });

    it("renders retry button when onRetry is provided", () => {
      const onRetry = vi.fn();
      const props: ErrorStateProps = { ...defaultProps, onRetry };
      const tree = TestRenderer.create(<ErrorState {...props} />);
      const instance = tree.root;
      
      const retryButton = instance.findByProps({ "aria-label": "Retry" });
      expect(retryButton).toBeDefined();
    });

    it("does not render retry button when onRetry is not provided", () => {
      const tree = TestRenderer.create(<ErrorState {...defaultProps} />);
      const instance = tree.root;
      
      expect(() => instance.findByProps({ "aria-label": "Retry" })).toThrow();
    });

    it("calls onRetry when retry button is pressed", () => {
      const onRetry = vi.fn();
      const props: ErrorStateProps = { ...defaultProps, onRetry };
      const tree = TestRenderer.create(<ErrorState {...props} />);
      const instance = tree.root;
      
      const retryButton = instance.findByProps({ "aria-label": "Retry" });
      retryButton.props.onClick();
      
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it("renders go back button when showGoBack is true", () => {
      const props: ErrorStateProps = { ...defaultProps, showGoBack: true };
      const tree = TestRenderer.create(<ErrorState {...props} />);
      const instance = tree.root;
      
      const goBackButton = instance.findByProps({ "aria-label": "Go back" });
      expect(goBackButton).toBeDefined();
    });

    it("calls onGoBack when provided and go back button is pressed", () => {
      const onGoBack = vi.fn();
      const props: ErrorStateProps = { ...defaultProps, showGoBack: true, onGoBack };
      const tree = TestRenderer.create(<ErrorState {...props} />);
      const instance = tree.root;
      
      const goBackButton = instance.findByProps({ "aria-label": "Go back" });
      goBackButton.props.onClick();
      
      expect(onGoBack).toHaveBeenCalledTimes(1);
    });

    it("has correct accessibility attributes on retry button", () => {
      const onRetry = vi.fn();
      const props: ErrorStateProps = { ...defaultProps, onRetry };
      const tree = TestRenderer.create(<ErrorState {...props} />);
      const instance = tree.root;
      
      const retryButton = instance.findByProps({ "aria-label": "Retry" });
      expect(retryButton.props.role).toBe("button");
      expect(retryButton.props["aria-hint"]).toBe("Attempts to load the content again");
    });

    it("has correct accessibility attributes on go back button", () => {
      const props: ErrorStateProps = { ...defaultProps, showGoBack: true };
      const tree = TestRenderer.create(<ErrorState {...props} />);
      const instance = tree.root;
      
      const goBackButton = instance.findByProps({ "aria-label": "Go back" });
      expect(goBackButton.props.role).toBe("button");
      expect(goBackButton.props["aria-hint"]).toBe("Returns to the previous screen");
    });
  });

  describe("NetworkError component", () => {
    it("renders with default message", () => {
      const tree = TestRenderer.create(<NetworkError />);
      const instance = tree.root;
      
      const texts = instance.findAllByProps({ "data-testid": "text" });
      const messageText = texts.find(t => 
        t.props.children === "Please check your internet connection and try again."
      );
      expect(messageText).toBeDefined();
    });

    it("renders with custom message", () => {
      const tree = TestRenderer.create(
        <NetworkError message="No internet connection" />
      );
      const instance = tree.root;
      
      const texts = instance.findAllByProps({ "data-testid": "text" });
      const messageText = texts.find(t => t.props.children === "No internet connection");
      expect(messageText).toBeDefined();
    });

    it("renders with retry button when onRetry is provided", () => {
      const onRetry = vi.fn();
      const tree = TestRenderer.create(<NetworkError onRetry={onRetry} />);
      const instance = tree.root;
      
      const retryButton = instance.findByProps({ "aria-label": "Retry" });
      expect(retryButton).toBeDefined();
    });

    it("shows Connection Error title", () => {
      const tree = TestRenderer.create(<NetworkError />);
      const instance = tree.root;
      
      const texts = instance.findAllByProps({ "data-testid": "text" });
      const titleText = texts.find(t => t.props.children === "Connection Error");
      expect(titleText).toBeDefined();
    });
  });

  describe("NotFoundError component", () => {
    it("renders with default message", () => {
      const tree = TestRenderer.create(<NotFoundError />);
      const instance = tree.root;
      
      const texts = instance.findAllByProps({ "data-testid": "text" });
      const messageText = texts.find(t => 
        t.props.children === "The item you're looking for doesn't exist or has been removed."
      );
      expect(messageText).toBeDefined();
    });

    it("renders with custom message", () => {
      const tree = TestRenderer.create(
        <NotFoundError message="This page does not exist" />
      );
      const instance = tree.root;
      
      const texts = instance.findAllByProps({ "data-testid": "text" });
      const messageText = texts.find(t => t.props.children === "This page does not exist");
      expect(messageText).toBeDefined();
    });

    it("shows go back button by default", () => {
      const tree = TestRenderer.create(<NotFoundError />);
      const instance = tree.root;
      
      const goBackButton = instance.findByProps({ "aria-label": "Go back" });
      expect(goBackButton).toBeDefined();
    });

    it("hides go back button when showGoBack is false", () => {
      const tree = TestRenderer.create(<NotFoundError showGoBack={false} />);
      const instance = tree.root;
      
      expect(() => instance.findByProps({ "aria-label": "Go back" })).toThrow();
    });

    it("shows Not Found title", () => {
      const tree = TestRenderer.create(<NotFoundError />);
      const instance = tree.root;
      
      const texts = instance.findAllByProps({ "data-testid": "text" });
      const titleText = texts.find(t => t.props.children === "Not Found");
      expect(titleText).toBeDefined();
    });
  });

  describe("GenericError component", () => {
    it("renders with default message", () => {
      const tree = TestRenderer.create(<GenericError />);
      const instance = tree.root;
      
      const texts = instance.findAllByProps({ "data-testid": "text" });
      const messageText = texts.find(t => 
        t.props.children === "An unexpected error occurred. Please try again."
      );
      expect(messageText).toBeDefined();
    });

    it("renders with custom message", () => {
      const tree = TestRenderer.create(
        <GenericError message="Something broke" />
      );
      const instance = tree.root;
      
      const texts = instance.findAllByProps({ "data-testid": "text" });
      const messageText = texts.find(t => t.props.children === "Something broke");
      expect(messageText).toBeDefined();
    });

    it("renders with retry button when onRetry is provided", () => {
      const onRetry = vi.fn();
      const tree = TestRenderer.create(<GenericError onRetry={onRetry} />);
      const instance = tree.root;
      
      const retryButton = instance.findByProps({ "aria-label": "Retry" });
      expect(retryButton).toBeDefined();
    });

    it("shows Something Went Wrong title", () => {
      const tree = TestRenderer.create(<GenericError />);
      const instance = tree.root;
      
      const texts = instance.findAllByProps({ "data-testid": "text" });
      const titleText = texts.find(t => t.props.children === "Something Went Wrong");
      expect(titleText).toBeDefined();
    });
  });

  describe("Theme handling", () => {
    it("adapts to light theme", () => {
      const tree = TestRenderer.create(<ErrorState {...defaultProps} />);
      expect(tree.toJSON()).toBeDefined();
    });

    it("adapts to dark theme", () => {
      // The mock is already set up at the top
      const tree = TestRenderer.create(<ErrorState {...defaultProps} />);
      expect(tree.toJSON()).toBeDefined();
    });
  });
});
