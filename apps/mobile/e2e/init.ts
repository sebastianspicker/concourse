/**
 * Detox E2E test initialization
 * @see https://wix.github.io/Detox/docs/introduction/your-first-test
 */

import { device, element, by, expect as detoxExpect } from "detox";

// Re-export detox helpers for convenience
export { device, element, by, detoxExpect };

/**
 * Wait for an element to be visible with a timeout
 */
export async function waitForElement(
  testID: string,
  timeout: number = 10000
): Promise<void> {
  await waitFor(element(by.id(testID)))
    .toBeVisible()
    .withTimeout(timeout);
}

/**
 * Wait for an element to exist (not necessarily visible)
 */
export async function waitForElementToExist(
  testID: string,
  timeout: number = 10000
): Promise<void> {
  await waitFor(element(by.id(testID)))
    .toExist()
    .withTimeout(timeout);
}

/**
 * Tap an element by testID
 */
export async function tapElement(testID: string): Promise<void> {
  await element(by.id(testID)).tap();
}

/**
 * Type text into an element by testID
 */
export async function typeText(
  testID: string,
  text: string
): Promise<void> {
  await element(by.id(testID)).typeText(text);
}

/**
 * Clear text from an element by testID
 */
export async function clearText(testID: string): Promise<void> {
  await element(by.id(testID)).clearText();
}

/**
 * Replace text in an element by testID
 */
export async function replaceText(
  testID: string,
  text: string
): Promise<void> {
  await element(by.id(testID)).replaceText(text);
}

/**
 * Scroll to an element by testID
 */
export async function scrollToElement(
  scrollViewTestID: string,
  elementTestID: string,
  direction: "up" | "down" | "left" | "right" = "down"
): Promise<void> {
  await waitFor(element(by.id(elementTestID)))
    .toBeVisible()
    .whileElement(by.id(scrollViewTestID))
    .scroll(100, direction);
}

/**
 * Swipe an element by testID
 */
export async function swipeElement(
  testID: string,
  direction: "up" | "down" | "left" | "right",
  speed: "fast" | "slow" = "fast",
  percentage: number = 0.75
): Promise<void> {
  await element(by.id(testID)).swipe(direction, speed, percentage);
}

/**
 * Check if element is visible
 */
export async function expectElementToBeVisible(
  testID: string
): Promise<void> {
  await detoxExpect(element(by.id(testID))).toBeVisible();
}

/**
 * Check if element exists
 */
export async function expectElementToExist(testID: string): Promise<void> {
  await detoxExpect(element(by.id(testID))).toExist();
}

/**
 * Check if element has text
 */
export async function expectElementToHaveText(
  testID: string,
  text: string
): Promise<void> {
  await detoxExpect(element(by.id(testID))).toHaveText(text);
}

/**
 * Check if element has label
 */
export async function expectElementToHaveLabel(
  testID: string,
  label: string
): Promise<void> {
  await detoxExpect(element(by.id(testID))).toHaveLabel(label);
}

/**
 * Check if element has value
 */
export async function expectElementToHaveValue(
  testID: string,
  value: string
): Promise<void> {
  await detoxExpect(element(by.id(testID))).toHaveValue(value);
}

/**
 * Check if element is not visible
 */
export async function expectElementNotToBeVisible(
  testID: string
): Promise<void> {
  await detoxExpect(element(by.id(testID))).not.toBeVisible();
}

/**
 * Check if element does not exist
 */
export async function expectElementNotToExist(
  testID: string
): Promise<void> {
  await detoxExpect(element(by.id(testID))).not.toExist();
}

/**
 * Navigate back (Android back button or iOS swipe)
 */
export async function navigateBack(): Promise<void> {
  if (device.getPlatform() === "android") {
    await device.pressBack();
  } else {
    // iOS: Use swipe to go back or tap back button if available
    try {
      await element(by.traits(["button"]).and(by.label("Back"))).tap();
    } catch {
      // If no back button, try swipe from edge
      // Note: This requires the app to support edge swipe
    }
  }
}

/**
 * Launch app with fresh state
 */
export async function launchAppFresh(): Promise<void> {
  await device.launchApp({ newInstance: true, delete: true });
}

/**
 * Relaunch app
 */
export async function relaunchApp(): Promise<void> {
  await device.launchApp({ newInstance: true });
}

/**
 * Send app to background
 */
export async function sendAppToBackground(): Promise<void> {
  await device.sendToHome();
}

/**
 * Bring app to foreground
 */
export async function bringAppToForeground(): Promise<void> {
  await device.launchApp({ newInstance: false });
}

/**
 * Toggle airplane mode (Android only)
 */
export async function toggleAirplaneMode(): Promise<void> {
  if (device.getPlatform() === "android") {
    await device.setAirplaneMode(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await device.setAirplaneMode(false);
  }
}

/**
 * Wait for a specified duration
 */
export async function wait(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Default test timeout for E2E tests
 */
export const E2E_TIMEOUT = 30000;

/**
 * Test IDs used in the app
 * These should match the testID props in the components
 */
export const TEST_IDS = {
  // Navigation
  TAB_BAR: "tab-bar",
  EVENTS_TAB: "events-tab",
  SCHEDULE_TAB: "schedule-tab",
  ROOMS_TAB: "rooms-tab",
  PROFILE_TAB: "profile-tab",
  
  // Screens
  HOME_SCREEN: "home-screen",
  EVENTS_SCREEN: "events-screen",
  SCHEDULE_SCREEN: "schedule-screen",
  ROOMS_SCREEN: "rooms-screen",
  PROFILE_SCREEN: "profile-screen",
  
  // Lists
  EVENTS_LIST: "events-list",
  SCHEDULE_LIST: "schedule-list",
  ROOMS_LIST: "rooms-list",
  
  // Items
  EVENT_ITEM: "event-item",
  SCHEDULE_ITEM: "schedule-item",
  ROOM_ITEM: "room-item",
  
  // Details
  EVENT_DETAIL: "event-detail",
  SCHEDULE_DETAIL: "schedule-detail",
  ROOM_DETAIL: "room-detail",
  
  // Loading states
  LOADING_INDICATOR: "loading-indicator",
  SKELETON_LIST: "skeleton-list",
  
  // Error states
  ERROR_STATE: "error-state",
  ERROR_RETRY_BUTTON: "error-retry-button",
  
  // Empty states
  EMPTY_STATE: "empty-state",
  
  // Search
  SEARCH_BAR: "search-bar",
  SEARCH_INPUT: "search-input",
  SEARCH_CLEAR_BUTTON: "search-clear-button",
  
  // Offline
  OFFLINE_INDICATOR: "offline-indicator",
  
  // Theme
  THEME_TOGGLE: "theme-toggle",
} as const;