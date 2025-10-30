// background.js
// Background Service Worker with CORS bypass + Emergency Content Extraction
// ✅ OPTIMIZED: Fast cookie-based authentication (no slow API validation!)

console.log("[Background] Service worker started");

// Configuration
const API_BASE = "506.ai";
const COOKIE_NAME = "__Secure-next-auth.session-token";
const DEBUG = true;

// Auth cache
let authCache = {
  isAuthenticated: null,
  activeDomain: null,
  lastCheck: 0,
  TTL: 30000, // 30 seconds
  hasMultipleDomains: false,
  availableDomains: [],
};

// Active tab tracking
let activeTabId = null;

// Debug helper
const debug = (...args) => {
  if (DEBUG) console.log("[Background]", ...args);
};

// ============================================
// EMERGENCY CONTENT EXTRACTION (Injected function)
// ============================================

/**
 * This function runs in the page context when content script isn't available
 * It's injected via chrome.scripting.executeScript
 */
function emergencyExtraction() {
  try {
    console.log("[Emergency Extraction] Starting...");

    // Get selected text if any
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString().trim() : "";

    // Find main content area using common selectors
    const contentElement =
      document.querySelector("main") ||
      document.querySelector('[role="main"]') ||
      document.querySelector("article") ||
      document.querySelector(".content") ||
      document.querySelector("#content") ||
      document.querySelector(".post-content") ||
      document.querySelector(".article-content") ||
      document.body;

    // Extract text content
    let content = "";
    if (contentElement) {
      content = contentElement.innerText || contentElement.textContent || "";
    }

    // Clean and truncate content (respect token limits)
    content = content.trim().replace(/\s+/g, " ").substring(0, 50000); // ~10k tokens

    console.log("[Emergency Extraction] Extracted:", content.length, "chars");

    return {
      success: true,
      title: document.title || "Untitled Page",
      url: window.location.href,
      content: content,
      selectedText: selectedText,
      siteType: "web",
      metadata: {
        extractionMethod: "emergency-injection",
        hostname: window.location.hostname,
      },
    };
  } catch (error) {
    console.error("[Emergency Extraction] Failed:", error);
    return {
      success: false,
      error: error.message || "Emergency extraction failed",
      title: document.title || "Error",
      url: window.location.href,
    };
  }
}

// ============================================
// DOMAIN DETECTION
// ============================================

async function detectActiveDomain() {
  try {
    const cookies = await chrome.cookies.getAll({
      domain: ".506.ai",
      name: COOKIE_NAME,
    });

    if (!cookies || cookies.length === 0) {
      debug("No cookies found");
      return { domain: null, hasMultiple: false, availableDomains: [] };
    }

    // Sort by most recent
    cookies.sort((a, b) => {
      const timeA = a.lastAccessed || a.expirationDate || 0;
      const timeB = b.lastAccessed || b.expirationDate || 0;
      return timeB - timeA;
    });

    // Extract unique subdomains
    const domains = cookies
      .map((cookie) => cookie.domain.replace(/^\./, "").replace(".506.ai", ""))
      .filter(Boolean);

    const uniqueDomains = [...new Set(domains)];
    const activeDomain = domains[0] || null;

    debug(`Active domain: ${activeDomain}`);

    return {
      domain: activeDomain,
      hasMultiple: uniqueDomains.length > 1,
      availableDomains: uniqueDomains,
    };
  } catch (error) {
    console.error("Domain detection failed:", error);
    return { domain: null, hasMultiple: false, availableDomains: [] };
  }
}

// ============================================
// ✅ OPTIMIZED: SIMPLE COOKIE EXPIRATION CHECK
// ============================================

async function checkAuth(skipCache = false) {
  // Use cache if available and not expired
  if (!skipCache && authCache.isAuthenticated !== null) {
    if (Date.now() - authCache.lastCheck < authCache.TTL) {
      debug(
        `Auth cache hit - Domain: ${authCache.activeDomain}, Authenticated: ${authCache.isAuthenticated}`
      );
      return authCache.isAuthenticated;
    }
  }

  try {
    const domainInfo = await detectActiveDomain();

    if (!domainInfo.domain) {
      debug("❌ No active domain found");
      authCache.isAuthenticated = false;
      authCache.lastCheck = Date.now();
      authCache.activeDomain = null;
      return false;
    }

    authCache.activeDomain = domainInfo.domain;
    authCache.hasMultipleDomains = domainInfo.hasMultiple;
    authCache.availableDomains = domainInfo.availableDomains;

    await chrome.storage.local.set({ lastKnownDomain: domainInfo.domain });

    // Get the auth cookie
    const cookie = await chrome.cookies.get({
      url: `https://${domainInfo.domain}.506.ai`,
      name: COOKIE_NAME,
    });

    // No cookie = not authenticated
    if (!cookie) {
      debug("❌ No auth cookie found");
      authCache.isAuthenticated = false;
      authCache.lastCheck = Date.now();
      return false;
    }

    // ✅ Check if cookie has expired
    // Chrome cookie expirationDate is in seconds since Unix epoch
    const now = Math.floor(Date.now() / 1000);

    if (cookie.expirationDate) {
      if (cookie.expirationDate <= now) {
        debug("❌ Auth cookie has expired");
        authCache.isAuthenticated = false;
        authCache.lastCheck = Date.now();
        return false;
      }

      // Cookie exists and not expired
      debug(
        `✅ Auth cookie valid - Domain: ${
          domainInfo.domain
        }, Expires: ${new Date(cookie.expirationDate * 1000).toISOString()}`
      );
    } else {
      // Session cookie (no expiration) - valid for browser session
      debug(
        `✅ Auth cookie valid (session cookie) - Domain: ${domainInfo.domain}`
      );
    }

    authCache.isAuthenticated = true;
    authCache.lastCheck = Date.now();

    debug(
      `Auth check complete - Domain: ${domainInfo.domain}, Cookie: YES ✅, Authenticated: true`
    );

    return true;
  } catch (error) {
    console.error("Auth check failed:", error);
    authCache.isAuthenticated = false;
    authCache.lastCheck = Date.now();
    return false;
  }
}

// ============================================
// CLEAR AUTH CACHE (called on 401)
// ============================================

function clearAuthCache() {
  debug("🔄 Clearing auth cache");
  authCache = {
    isAuthenticated: false,
    activeDomain: authCache.activeDomain, // Keep domain
    lastCheck: 0,
    TTL: authCache.TTL,
    hasMultipleDomains: authCache.hasMultipleDomains,
    availableDomains: authCache.availableDomains,
  };
}

// ============================================
// BROADCAST 401 ERROR TO PANEL
// ============================================

async function broadcast401Error() {
  debug("📢 Broadcasting 401 error to panel");

  // Clear auth cache immediately
  clearAuthCache();

  try {
    // Send message to all extension contexts (panel, popup, etc.)
    await chrome.runtime.sendMessage({
      action: "AUTH_ERROR_401",
      data: {
        reason: "Session expired or invalid",
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    // Ignore if no listeners (panel might not be open)
    debug("Could not broadcast 401 (no listeners):", error.message);
  }
}

// ============================================
// GENERIC API REQUEST HANDLER (CORS BYPASS!)
// ============================================

async function handleAPIRequest(data) {
  debug("API Request:", data.url);

  try {
    const options = {
      method: data.method || "GET",
      headers: data.headers || {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include", // Important: includes cookies!
    };

    if (data.body && data.method !== "GET") {
      options.body = data.body;
    }

    const response = await fetch(data.url, options);
    debug("Response status:", response.status);

    // ✅ Handle 401 errors
    if (response.status === 401) {
      debug("❌ 401 Unauthorized detected!");

      // Broadcast 401 error to panel
      await broadcast401Error();

      throw new Error("HTTP 401: Session expired or invalid");
    }

    if (!response.ok) {
      const errorText = await response.text();
      debug("Error response:", errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const text = await response.text();

    try {
      const json = JSON.parse(text);
      return { success: true, data: json };
    } catch {
      return { success: true, data: text };
    }
  } catch (error) {
    console.error("API request failed:", error);
    return { success: false, error: error.message };
  }
}

// ============================================
// MESSAGE HANDLERS
// ============================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  debug("Received message:", request.action || request.type);

  (async () => {
    try {
      const action = request.action || request.type;

      switch (action) {
        case "CHECK_AUTH": {
          const isAuthenticated = await checkAuth(request.skipCache);
          sendResponse({
            success: true,
            isAuthenticated,
            domain: authCache.activeDomain,
            hasMultipleDomains: authCache.hasMultipleDomains,
            availableDomains: authCache.availableDomains,
          });
          break;
        }

        case "API_REQUEST": {
          const result = await handleAPIRequest(request.data);
          sendResponse(result);
          break;
        }

        case "FETCH_FOLDERS": {
          const domain = authCache.activeDomain;
          if (!domain) {
            sendResponse({ success: false, error: "No domain configured" });
            break;
          }

          const result = await handleAPIRequest({
            url: `https://${domain}.${API_BASE}/api/folders`,
            method: "GET",
          });

          sendResponse(result);
          break;
        }

        case "FETCH_ROLES": {
          const domain = authCache.activeDomain;
          if (!domain) {
            sendResponse({ success: false, error: "No domain configured" });
            break;
          }

          const result = await handleAPIRequest({
            url: `https://${domain}.${API_BASE}/api/roles`,
            method: "GET",
          });

          sendResponse(result);
          break;
        }

        case "SEND_CHAT": {
          const domain = authCache.activeDomain;
          if (!domain) {
            sendResponse({ success: false, error: "No domain configured" });
            break;
          }

          const result = await handleAPIRequest({
            url: `https://${domain}.${API_BASE}/api/chats`,
            method: "POST",
            body: JSON.stringify(request.data),
          });

          sendResponse(result);
          break;
        }

        case "GET_PAGE_CONTEXT":
        case "EXTRACT_CONTENT": {
          debug("Content extraction requested");

          // Make sure we have an active tab ID
          if (!activeTabId) {
            const tabs = await chrome.tabs.query({
              active: true,
              currentWindow: true,
            });
            if (tabs[0]) {
              activeTabId = tabs[0].id;
            }
          }

          if (!activeTabId) {
            sendResponse({
              success: false,
              error: "No active tab available",
            });
            break;
          }

          // ✨ STRATEGY 1: Try content script first (for supported sites)
          try {
            const response = await chrome.tabs.sendMessage(activeTabId, {
              action: "EXTRACT_CONTENT",
              options: request.options || {},
            });

            debug("Content script extraction succeeded");
            sendResponse(response);
          } catch (error) {
            debug("Content script not available, using emergency injection");

            // ✨ STRATEGY 2: Emergency injection fallback (works on ANY page!)
            try {
              const results = await chrome.scripting.executeScript({
                target: { tabId: activeTabId },
                func: emergencyExtraction,
              });

              if (results && results[0] && results[0].result) {
                debug("Emergency extraction succeeded!");
                sendResponse(results[0].result);
              } else {
                sendResponse({
                  success: false,
                  error: "Emergency extraction returned no data",
                });
              }
            } catch (injectError) {
              debug("Emergency injection failed:", injectError);
              sendResponse({
                success: false,
                error: "Could not extract content from this page",
              });
            }
          }
          break;
        }

        default:
          debug("Unknown action:", action);
          sendResponse({ success: false, error: "Unknown action" });
      }
    } catch (error) {
      console.error(`Error handling ${request.action}:`, error);
      sendResponse({ success: false, error: error.message });
    }
  })();

  return true; // Keep message channel open
});

// ============================================
// EXTENSION ICON CLICK
// ============================================

chrome.action.onClicked.addListener(async (tab) => {
  debug("Extension icon clicked");
  activeTabId = tab.id;
  await chrome.sidePanel.open({ tabId: tab.id });
});

debug("Service worker initialized! 🚀");
