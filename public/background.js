// background.js
// Background Service Worker with CORS bypass

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

async function checkAuth(skipCache = false) {
  if (!skipCache && authCache.isAuthenticated !== null) {
    if (Date.now() - authCache.lastCheck < authCache.TTL) {
      debug(`Auth cache hit - Domain: ${authCache.activeDomain}`);
      return authCache.isAuthenticated;
    }
  }

  try {
    const domainInfo = await detectActiveDomain();

    if (!domainInfo.domain) {
      debug("No active domain found");
      authCache.isAuthenticated = false;
      authCache.lastCheck = Date.now();
      authCache.activeDomain = null;
      return false;
    }

    authCache.activeDomain = domainInfo.domain;
    authCache.hasMultipleDomains = domainInfo.hasMultiple;
    authCache.availableDomains = domainInfo.availableDomains;

    await chrome.storage.local.set({ lastKnownDomain: domainInfo.domain });

    const cookie = await chrome.cookies.get({
      url: `https://${domainInfo.domain}.506.ai`,
      name: COOKIE_NAME,
    });

    authCache.isAuthenticated = !!cookie;
    authCache.lastCheck = Date.now();

    debug(
      `Auth check complete - Domain: ${domainInfo.domain}, Auth: ${authCache.isAuthenticated}`
    );

    return authCache.isAuthenticated;
  } catch (error) {
    console.error("Auth check failed:", error);
    authCache.isAuthenticated = false;
    authCache.lastCheck = Date.now();
    return false;
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

        case "SEND_CHAT_MESSAGE": {
          const domain = authCache.activeDomain;
          if (!domain) {
            sendResponse({ success: false, error: "No domain configured" });
            break;
          }

          const result = await handleAPIRequest({
            url: `https://${domain}.${API_BASE}/api/qr/chat`,
            method: "POST",
            body: JSON.stringify(request.data),
          });

          sendResponse(result);
          break;
        }

        case "GET_PAGE_CONTEXT": {
          if (!activeTabId) {
            sendResponse({ success: false, error: "No active tab" });
            break;
          }

          try {
            const response = await chrome.tabs.sendMessage(activeTabId, {
              action: "EXTRACT_CONTENT",
            });
            sendResponse(response);
          } catch (error) {
            debug("Content script not available:", error);
            sendResponse({
              success: false,
              error: "Content script not loaded",
            });
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
