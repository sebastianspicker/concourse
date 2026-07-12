import { by, element } from "detox";
import { expectElementToBeVisible, launchAppFresh, TEST_IDS, waitForElement } from "./init";

describe("events discovery", () => {
  beforeEach(async () => {
    await launchAppFresh();
    await waitForElement(TEST_IDS.EVENTS_TAB, 15000);
    await element(by.id(TEST_IDS.EVENTS_TAB)).tap();
  });

  it("shows a labeled search and virtualized result surface", async () => {
    await expectElementToBeVisible(TEST_IDS.EVENTS_SCREEN);
    await expectElementToBeVisible(TEST_IDS.SEARCH_INPUT);
    await expectElementToBeVisible(TEST_IDS.EVENTS_LIST);
  });

  it("accepts and clears a search query", async () => {
    await element(by.id(TEST_IDS.SEARCH_INPUT)).typeText("concert");
    await waitForElement(TEST_IDS.SEARCH_CLEAR_BUTTON, 3000);
    await element(by.id(TEST_IDS.SEARCH_CLEAR_BUTTON)).tap();
    await expectElementToBeVisible(TEST_IDS.EVENTS_LIST);
  });
});
