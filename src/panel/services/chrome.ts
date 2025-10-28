// src/panel/services/chrome.ts
// Chrome Extension API wrapper

/**
 * Send a message to the background service worker
 */
export async function sendToBackground<T = unknown>(
  action: string,
  data?: unknown
): Promise<T> {
  try {
    console.log("[Chrome Service] Sending message:", action, data);

    const response = await chrome.runtime.sendMessage({
      action,
      data,
    });

    console.log("[Chrome Service] Response:", response);

    if (!response) {
      throw new Error("No response from background");
    }

    if (!response.success) {
      throw new Error(response.error || "Request failed");
    }

    return response.data || response;
  } catch (error: unknown) {
    console.error("[Chrome Service] Error:", error);
    throw new Error((error as Error).message || "Chrome API error");
  }
}

/**
 * Make an API request through background worker (CORS bypass!)
 */

export async function apiRequest<T = unknown>(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  try {
    console.log("[Chrome Service] API Request:", url);

    const response = await sendToBackground<T>("API_REQUEST", {
      url,
      method: options.method || "GET",
      headers: options.headers || {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    return response;
  } catch (error) {
    console.error("[Chrome Service] API request failed:", error);
    throw error;
  }
}

/**
 * Get data from Chrome storage
 */
export async function getStorage<T = unknown>(key: string): Promise<T | null> {
  try {
    const result = await chrome.storage.local.get(key);
    return result[key] || null;
  } catch (error) {
    console.error("[Chrome Service] Storage get error:", error);
    return null;
  }
}

/**
 * Set data in Chrome storage
 */
export async function setStorage(key: string, value: unknown): Promise<void> {
  try {
    await chrome.storage.local.set({ [key]: value });
  } catch (error) {
    console.error("[Chrome Service] Storage set error:", error);
  }
}

/**
 * Get current active tab info
 */
export async function getCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    return tab;
  } catch (error) {
    console.error("[Chrome Service] Get tab error:", error);
    return null;
  }
}
