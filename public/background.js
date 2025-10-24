// Background Service Worker
console.log("[Background] Service worker started");

// API base configuration
const API_BASE = "506.ai";
const COOKIE_NAME = "__Secure-next-auth.session-token";

// Auth cache
let authCache = {
  isAuthenticated: null,
  activeDomain: null,
  lastCheck: 0,
  TTL: 30000, // 30 seconds
};

// Open side panel when extension icon clicked
chrome.action.onClicked.addListener(async (tab) => {
  console.log("[Background] Extension icon clicked");
  if (tab.id) {
    await chrome.sidePanel.open({ tabId: tab.id });
  }
});

// Handle messages from panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("[Background] Received message:", request.action);

  handleMessage(request, sender, sendResponse);
  return true; // Keep channel open for async response
});

async function handleMessage(request, sender, sendResponse) {
  const { action, data } = request;

  try {
    switch (action) {
      case "CHECK_AUTH":
        await handleCheckAuth(sendResponse);
        break;

      case "FETCH_FOLDERS":
        await handleFetchFolders(sendResponse);
        break;

      case "FETCH_ROLES":
        await handleFetchRoles(sendResponse);
        break;

      case "SEND_CHAT_MESSAGE":
        await handleSendChatMessage(data, sendResponse);
        break;

      case "GET_PAGE_INFO":
        await handleGetPageInfo(sendResponse);
        break;

      default:
        sendResponse({ success: false, error: "Unknown action" });
    }
  } catch (error) {
    console.error("[Background] Error:", error);
    sendResponse({ success: false, error: error.message });
  }
}

// Check authentication
async function handleCheckAuth(sendResponse) {
  try {
    const domain = await getActiveDomain();

    if (!domain) {
      sendResponse({
        success: true,
        isAuthenticated: false,
        domain: null,
        hasMultipleDomains: false,
        availableDomains: [],
      });
      return;
    }

    const cookie = await chrome.cookies.get({
      url: `https://${domain}.${API_BASE}`,
      name: COOKIE_NAME,
    });

    sendResponse({
      success: true,
      isAuthenticated: !!cookie,
      domain: domain,
      hasMultipleDomains: false,
      availableDomains: [domain],
    });
  } catch (error) {
    console.error("[Background] Check auth error:", error);
    sendResponse({ success: false, error: error.message });
  }
}

// Fetch folders
async function handleFetchFolders(sendResponse) {
  try {
    const domain = await getActiveDomain();
    if (!domain) throw new Error("No domain configured");

    const url = `https://${domain}.${API_BASE}/api/folders`;
    console.log("[Background] Fetching folders from:", url);

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log("[Background] Folders response:", data);

    sendResponse({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("[Background] Fetch folders error:", error);
    sendResponse({ success: false, error: error.message });
  }
}

// Fetch roles
async function handleFetchRoles(sendResponse) {
  try {
    const domain = await getActiveDomain();
    if (!domain) throw new Error("No domain configured");

    const url = `https://${domain}.${API_BASE}/api/roles`;
    console.log("[Background] Fetching roles from:", url);

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log("[Background] Roles response:", data);

    sendResponse({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("[Background] Fetch roles error:", error);
    sendResponse({ success: false, error: error.message });
  }
}

// Send chat message
async function handleSendChatMessage(payload, sendResponse) {
  try {
    const domain = await getActiveDomain();
    if (!domain) throw new Error("No domain configured");

    const url = `https://${domain}.${API_BASE}/api/qr/chat`;
    console.log("[Background] Sending chat to:", url);
    console.log("[Background] Payload:", payload);

    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const text = await response.text();
    console.log("[Background] Chat response:", text);

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    sendResponse({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("[Background] Send chat error:", error);
    sendResponse({ success: false, error: error.message });
  }
}

// Get page info
async function handleGetPageInfo(sendResponse) {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    sendResponse({
      success: true,
      title: tab?.title || "",
      url: tab?.url || "",
    });
  } catch (error) {
    console.error("[Background] Get page info error:", error);
    sendResponse({ success: false, error: error.message });
  }
}

// Get active domain
async function getActiveDomain() {
  try {
    // Try to get from storage first
    const result = await chrome.storage.local.get("activeDomain");
    if (result.activeDomain) {
      return result.activeDomain;
    }

    // Default domain (you can change this to your domain)
    return "companygpt"; // Change to your actual domain
  } catch (error) {
    console.error("[Background] Get domain error:", error);
    return null;
  }
}

console.log("[Background] Service worker ready");
