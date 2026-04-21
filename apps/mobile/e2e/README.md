# E2E Testing with Detox

E2E tests for the Campus Mobile app using [Detox](https://wix.github.io/Detox/).

## Prerequisites

Required:

### iOS (macOS only)
- Xcode 14+ with iOS Simulator
- CocoaPods (`sudo gem install cocoapods`)
- applesimutils (`brew tap wix/brew && brew install applesimutils`)

### Android
- Android Studio with Android SDK
- Android Emulator with a device running API 28+
- Java 11+

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Build the app for testing:
   ```bash
   # iOS
   pnpm test:e2e:build:ios
   
   # Android
   pnpm test:e2e:build:android
   ```

## Running Tests

### iOS
```bash
# Build and run tests
pnpm test:e2e:build:ios
pnpm test:e2e:ios

# Or run release configuration
detox test -c ios.release
```

### Android
```bash
# Build and run tests
pnpm test:e2e:build:android
pnpm test:e2e:android

# Or run release configuration
detox test -c android.release
```

## Test Structure

```
e2e/
├── init.ts              # Test initialization and helper functions
├── events.test.ts       # Events flow tests
├── schedule.test.ts     # Schedule flow tests
├── navigation.test.ts   # Navigation tests
└── README.md            # This file
```

## Writing Tests

### Test IDs

Components should have `testID` props for E2E testing. Use the `TEST_IDS` constant from `init.ts`:

```typescript
import { TEST_IDS } from "./init";

// In your component
<View testID={TEST_IDS.EVENTS_SCREEN}>
  {/* ... */}
</View>
```

### Helper Functions

The `init.ts` file provides helper functions:

- `waitForElement(testID, timeout)` - Wait for element to be visible
- `tapElement(testID)` - Tap an element
- `typeText(testID, text)` - Type text into an input
- `expectElementToBeVisible(testID)` - Assert element is visible
- `expectElementToExist(testID)` - Assert element exists
- `launchAppFresh()` - Launch app with fresh state
- `navigateBack()` - Navigate back (handles iOS/Android differences)

### Example Test

```typescript
import { device, element, by, waitFor } from "detox";
import { waitForElement, tapElement, TEST_IDS } from "./init";

describe("My Feature", () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it("should display my screen", async () => {
    await waitForElement(TEST_IDS.MY_SCREEN);
    await expect(element(by.id(TEST_IDS.MY_SCREEN))).toBeVisible();
  });
});
```

## CI Integration

E2E tests run in GitHub Actions. See `.github/workflows/e2e.yml` for configuration.

### Running in CI

Tests run automatically on:
- Pull requests to `main`
- Pushes to `main`

## Debugging

### View Test Logs
```bash
detox test -c ios --loglevel verbose
```

### Take Screenshots
Screenshots are automatically saved to `artifacts/` on test failure.

### Interactive Debugging
```bash
# Run specific test file
detox test -c ios e2e/events.test.ts

# Run specific test
detox test -c ios -t "should display events list"
```

## Troubleshooting

### iOS Issues

**"Unable to find simulator"**
- Ensure the simulator is installed: `xcrun simctl list devices`
- Check `detox.config.js` device type matches an available simulator

**"App not installed"**
- Build the app first: `pnpm test:e2e:build:ios`

### Android Issues

**"Unable to find emulator"**
- Start the emulator manually: `emulator -avd Pixel_5_API_33`
- Or create a new AVD in Android Studio

**"App not installed"**
- Build the app first: `pnpm test:e2e:build:android`

### General Issues

**Tests timeout**
- Increase timeout in `init.ts`: `E2E_TIMEOUT = 60000`
- Check network connectivity

**Flaky tests**
- Use `waitFor` instead of immediate assertions
- Add appropriate delays for animations
- Ensure proper test isolation with `beforeEach`

## Best Practices

- Add `testID` to interactive elements so Detox can find them.
- Use `waitFor` for async operations — avoid hardcoded `setTimeout` delays.
- Use `launchAppFresh` when a test needs a clean state.
- Each test should work in isolation; don't rely on state from a previous test.
- Focus tests on critical user flows, not implementation details.