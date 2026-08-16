/** Uses browser sharing when available and a clipboard link fallback otherwise. */
export type WebShareResult = "shared" | "copied" | "cancelled" | "failed";

type BrowserNavigator = {
  share?: (data: ShareData) => Promise<void>;
  clipboard?: { writeText?: (text: string) => Promise<void> };
};

function isShareCancellation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";
}

async function attemptBrowserShare(browser: BrowserNavigator, title: string, url: string): Promise<WebShareResult> {
  try {
    await browser.share!({ title, text: title, url });
    return "shared";
  } catch (error) {
    return isShareCancellation(error) ? "cancelled" : "failed";
  }
}

async function attemptClipboardCopy(browser: BrowserNavigator | undefined, url: string): Promise<WebShareResult> {
  try {
    if (!browser?.clipboard?.writeText) return "failed";
    await browser.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}

/** Shares an event link without allowing browser API failures to escape a press handler. */
export async function shareEventOnWeb(title: string, url: string): Promise<WebShareResult> {
  const browser = globalThis.navigator as BrowserNavigator | undefined;

  if (browser?.share) {
    return attemptBrowserShare(browser, title, url);
  }

  return attemptClipboardCopy(browser, url);
}
