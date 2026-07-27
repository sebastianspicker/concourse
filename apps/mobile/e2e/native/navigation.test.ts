/** Exercises tab and resource-detail navigation paths on native devices. */
import { by, device, element } from "detox";
import { expectElementToBeVisible, launchAppFresh, TEST_IDS, waitForElement } from "./init";

describe("public navigation", () => {
  beforeEach(async () => {
    await launchAppFresh();
    await waitForElement(TEST_IDS.TODAY_TAB, 15000);
  });

  it("shows the four public destinations", async () => {
    await expectElementToBeVisible(TEST_IDS.TODAY_TAB);
    await expectElementToBeVisible(TEST_IDS.EVENTS_TAB);
    await expectElementToBeVisible(TEST_IDS.ROOMS_TAB);
    await expectElementToBeVisible(TEST_IDS.SETTINGS_TAB);
  });

  it("navigates between Today, Events, Rooms, and Settings", async () => {
    await element(by.id(TEST_IDS.EVENTS_TAB)).tap();
    await expectElementToBeVisible(TEST_IDS.EVENTS_SCREEN);
    await element(by.id(TEST_IDS.ROOMS_TAB)).tap();
    await expectElementToBeVisible(TEST_IDS.ROOMS_SCREEN);
    await element(by.id(TEST_IDS.SETTINGS_TAB)).tap();
    await expectElementToBeVisible(TEST_IDS.SETTINGS_SCREEN);
    await element(by.id(TEST_IDS.TODAY_TAB)).tap();
    await expectElementToBeVisible(TEST_IDS.HOME_SCREEN);
  });

  it("opens the supported app scheme without suppressing failures", async () => {
    await device.launchApp({ newInstance: false, url: "concourse://events/missing" });
    await waitForElement("detail-screen", 10000);
  });
});
