/**
 * Detox configuration for E2E testing
 * @see https://wix.github.io/Detox/docs/introduction/project-setup
 */

module.exports = {
  testRunner: {
    args: {
      "$0": "jest",
      config: "e2e/jest.config.js"
    },
    jest: "29"
  },
  apps: {
    "ios.debug": {
      type: "ios.app",
      binaryPath: "ios/build/Build/Products/Debug-iphonesimulator/CampusApp.app",
      build: "xcodebuild -workspace ios/CampusApp.xcworkspace -scheme CampusApp -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build"
    },
    "ios.release": {
      type: "ios.app",
      binaryPath: "ios/build/Build/Products/Release-iphonesimulator/CampusApp.app",
      build: "xcodebuild -workspace ios/CampusApp.xcworkspace -scheme CampusApp -configuration Release -sdk iphonesimulator -derivedDataPath ios/build"
    },
    "android.debug": {
      type: "android.apk",
      binaryPath: "android/app/build/outputs/apk/debug/app-debug.apk",
      build: "cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug"
    },
    "android.release": {
      type: "android.apk",
      binaryPath: "android/app/build/outputs/apk/release/app-release.apk",
      build: "cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release"
    }
  },
  devices: {
    simulator: {
      type: "ios.simulator",
      device: {
        type: "iPhone 15"
      }
    },
    emulator: {
      type: "android.emulator",
      device: {
        avdName: "Pixel_5_API_33"
      }
    }
  },
  configurations: {
    "ios": {
      device: "simulator",
      app: "ios.debug"
    },
    "ios.release": {
      device: "simulator",
      app: "ios.release"
    },
    "android": {
      device: "emulator",
      app: "android.debug"
    },
    "android.release": {
      device: "emulator",
      app: "android.release"
    }
  }
};