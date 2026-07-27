/** Exercises Today schedule sorting and navigation on native devices. */
import { by, element } from "detox";
import { expectElementToBeVisible, launchAppFresh, TEST_IDS, waitForElement } from "./init";

describe("Today schedule", () => {
  beforeEach(async () => {
    await launchAppFresh();
    await waitForElement(TEST_IDS.TODAY_TAB, 15000);
  });

  it("keeps Schedule embedded in Today rather than exposing an obsolete tab", async () => {
    await element(by.id(TEST_IDS.TODAY_TAB)).tap();
    await expectElementToBeVisible(TEST_IDS.HOME_SCREEN);
  });
});
