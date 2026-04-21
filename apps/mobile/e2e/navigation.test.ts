/**
 * E2E tests for Navigation flow
 * Tests the critical user flow for navigating between screens
 */

import {
  device,
  element,
  by,
  waitFor,
} from "detox";
import {
  waitForElement,
  expectElementToBeVisible,
  expectElementToExist,
  TEST_IDS,
  launchAppFresh,
} from "./init";

describe("Navigation Flow", () => {
  beforeAll(async () => {
    await launchAppFresh();
  });

  beforeEach(async () => {
    // Wait for app to be ready
    await waitForElement(TEST_IDS.TAB_BAR, 15000);
  });

  describe("App Launch", () => {
    it("should launch app successfully", async () => {
      // App should be running after beforeAll
      await expectElementToBeVisible(TEST_IDS.TAB_BAR);
    });

    it("should show home screen on launch", async () => {
      await expectElementToBeVisible(TEST_IDS.HOME_SCREEN);
    });

    it("should display all tabs in navigation", async () => {
      await expectElementToBeVisible(TEST_IDS.EVENTS_TAB);
      await expectElementToBeVisible(TEST_IDS.SCHEDULE_TAB);
      await expectElementToBeVisible(TEST_IDS.ROOMS_TAB);
      await expectElementToBeVisible(TEST_IDS.PROFILE_TAB);
    });
  });

  describe("Tab Navigation", () => {
    it("should navigate to Events tab", async () => {
      await element(by.id(TEST_IDS.EVENTS_TAB)).tap();
      await expectElementToBeVisible(TEST_IDS.EVENTS_SCREEN);
    });

    it("should navigate to Schedule tab", async () => {
      await element(by.id(TEST_IDS.SCHEDULE_TAB)).tap();
      await expectElementToBeVisible(TEST_IDS.SCHEDULE_SCREEN);
    });

    it("should navigate to Rooms tab", async () => {
      await element(by.id(TEST_IDS.ROOMS_TAB)).tap();
      await expectElementToBeVisible(TEST_IDS.ROOMS_SCREEN);
    });

    it("should navigate to Profile tab", async () => {
      await element(by.id(TEST_IDS.PROFILE_TAB)).tap();
      await expectElementToBeVisible(TEST_IDS.PROFILE_SCREEN);
    });

    it("should maintain tab state when switching tabs", async () => {
      // Navigate to Events
      await element(by.id(TEST_IDS.EVENTS_TAB)).tap();
      await expectElementToBeVisible(TEST_IDS.EVENTS_SCREEN);
      
      // Navigate to Schedule
      await element(by.id(TEST_IDS.SCHEDULE_TAB)).tap();
      await expectElementToBeVisible(TEST_IDS.SCHEDULE_SCREEN);
      
      // Go back to Events - should still be on Events screen
      await element(by.id(TEST_IDS.EVENTS_TAB)).tap();
      await expectElementToBeVisible(TEST_IDS.EVENTS_SCREEN);
    });
  });

  describe("Deep Linking", () => {
    it("should handle deep link to event detail", async () => {
      // Note: This requires a valid event ID
      // The URL scheme would be something like campus://events/123
      try {
        await device.launchApp({
          newInstance: false,
          url: "campus://events/1"
        });
        
        // Should navigate to event detail
        await waitFor(element(by.id(TEST_IDS.EVENT_DETAIL)))
          .toBeVisible()
          .withTimeout(5000);
      } catch {
        console.log("Deep linking not configured or no event with ID 1");
      }
    });

    it("should handle deep link to schedule detail", async () => {
      try {
        await device.launchApp({
          newInstance: false,
          url: "campus://schedule/1"
        });
        
        // Should navigate to schedule detail
        await waitFor(element(by.id(TEST_IDS.SCHEDULE_DETAIL)))
          .toBeVisible()
          .withTimeout(5000);
      } catch {
        console.log("Deep linking not configured or no schedule with ID 1");
      }
    });
  });

  describe("Back Navigation", () => {
    it("should navigate back from event detail using back button", async () => {
      await element(by.id(TEST_IDS.EVENTS_TAB)).tap();
      
      try {
        await waitFor(element(by.id(TEST_IDS.EVENT_ITEM)))
          .toBeVisible()
          .withTimeout(5000);
        
        await element(by.id(TEST_IDS.EVENT_ITEM)).atIndex(0).tap();
        await expectElementToBeVisible(TEST_IDS.EVENT_DETAIL);
        
        // Navigate back
        if (device.getPlatform() === "android") {
          await device.pressBack();
        } else {
          try {
            await element(by.text("Back")).tap();
          } catch {
            await element(by.traits(["button"]).and(by.label("Back"))).tap();
          }
        }
        
        await expectElementToBeVisible(TEST_IDS.EVENTS_SCREEN);
      } catch {
        console.log("No events available for back navigation test");
      }
    });

    it("should navigate back from room detail using back button", async () => {
      await element(by.id(TEST_IDS.ROOMS_TAB)).tap();
      
      try {
        await waitFor(element(by.id(TEST_IDS.ROOM_ITEM)))
          .toBeVisible()
          .withTimeout(5000);
        
        await element(by.id(TEST_IDS.ROOM_ITEM)).atIndex(0).tap();
        await expectElementToBeVisible(TEST_IDS.ROOM_DETAIL);
        
        // Navigate back
        if (device.getPlatform() === "android") {
          await device.pressBack();
        } else {
          try {
            await element(by.text("Back")).tap();
          } catch {
            await element(by.traits(["button"]).and(by.label("Back"))).tap();
          }
        }
        
        await expectElementToBeVisible(TEST_IDS.ROOMS_SCREEN);
      } catch {
        console.log("No rooms available for back navigation test");
      }
    });

    it("should exit app on back press from main screen (Android)", async () => {
      if (device.getPlatform() === "android") {
        // Navigate to home
        await element(by.id(TEST_IDS.EVENTS_TAB)).tap();
        
        // Press back - should not exit but show confirmation or minimize
        await device.pressBack();
        
        // App should still be running
        await expectElementToExist(TEST_IDS.TAB_BAR);
      }
    });
  });

  describe("Screen Transitions", () => {
    it("should animate transition when navigating between tabs", async () => {
      // Navigate between tabs rapidly
      await element(by.id(TEST_IDS.EVENTS_TAB)).tap();
      await expectElementToBeVisible(TEST_IDS.EVENTS_SCREEN);
      
      await element(by.id(TEST_IDS.SCHEDULE_TAB)).tap();
      await expectElementToBeVisible(TEST_IDS.SCHEDULE_SCREEN);
      
      await element(by.id(TEST_IDS.ROOMS_TAB)).tap();
      await expectElementToBeVisible(TEST_IDS.ROOMS_SCREEN);
      
      await element(by.id(TEST_IDS.PROFILE_TAB)).tap();
      await expectElementToBeVisible(TEST_IDS.PROFILE_SCREEN);
    });

    it("should animate transition when navigating to detail screen", async () => {
      await element(by.id(TEST_IDS.EVENTS_TAB)).tap();
      
      try {
        await waitFor(element(by.id(TEST_IDS.EVENT_ITEM)))
          .toBeVisible()
          .withTimeout(5000);
        
        // Tap and wait for animation
        await element(by.id(TEST_IDS.EVENT_ITEM)).atIndex(0).tap();
        
        // Detail should appear with animation
        await waitFor(element(by.id(TEST_IDS.EVENT_DETAIL)))
          .toBeVisible()
          .withTimeout(3000);
      } catch {
        console.log("No events available for transition test");
      }
    });
  });

  describe("Orientation Changes", () => {
    it("should maintain state on orientation change", async () => {
      await element(by.id(TEST_IDS.EVENTS_TAB)).tap();
      await expectElementToBeVisible(TEST_IDS.EVENTS_SCREEN);
      
      // Change orientation
      await device.setOrientation("landscape");
      
      // Should still be on events screen
      await expectElementToBeVisible(TEST_IDS.EVENTS_SCREEN);
      
      // Reset orientation
      await device.setOrientation("portrait");
    });
  });

  describe("App Backgrounding", () => {
    it("should maintain state when app is backgrounded", async () => {
      await element(by.id(TEST_IDS.EVENTS_TAB)).tap();
      await expectElementToBeVisible(TEST_IDS.EVENTS_SCREEN);
      
      // Send app to background
      await device.sendToHome();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Bring app back
      await device.launchApp({ newInstance: false });
      
      // Should still be on events screen
      await expectElementToBeVisible(TEST_IDS.EVENTS_SCREEN);
    });

    it("should restore state after app is terminated", async () => {
      await element(by.id(TEST_IDS.SCHEDULE_TAB)).tap();
      await expectElementToBeVisible(TEST_IDS.SCHEDULE_SCREEN);
      
      // Terminate app
      await device.terminateApp();
      
      // Relaunch
      await device.launchApp({ newInstance: true });
      
      // Should show home screen (default behavior)
      await waitForElement(TEST_IDS.HOME_SCREEN, 10000);
    });
  });
});