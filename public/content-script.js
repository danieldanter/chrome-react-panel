// content-script.js
// Content script for extracting page content

console.log("[Content Script] Loaded on:", window.location.hostname);

// Detect site type
function detectSiteType() {
  const hostname = window.location.hostname;

  if (hostname.includes("mail.google.com")) {
    return "gmail";
  } else if (hostname.includes("docs.google.com")) {
    return "gdocs";
  } else if (
    hostname.includes("sharepoint.com") ||
    hostname.includes("office.com")
  ) {
    return "sharepoint";
  } else {
    return "web";
  }
}

// Extract content based on site type
function extractContent() {
  const siteType = detectSiteType();
  console.log("[Content Script] Extracting content for:", siteType);

  try {
    switch (siteType) {
      case "gmail":
        return extractGmail();
      case "gdocs":
        return extractGoogleDocs();
      case "sharepoint":
        return extractSharePoint();
      default:
        return extractGeneric();
    }
  } catch (error) {
    console.error("[Content Script] Extraction failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Gmail extraction
function extractGmail() {
  console.log("[Content Script] Extracting Gmail content...");

  const emailBody =
    document.querySelector(".a3s.aiL") ||
    document.querySelector(".ii.gt") ||
    document.querySelector('[role="main"]');

  if (!emailBody) {
    return {
      success: false,
      error: "No email content found",
    };
  }

  const content = emailBody.innerText || emailBody.textContent || "";
  const subject =
    document.querySelector("h2.hP")?.innerText ||
    document.querySelector(".ha h2")?.innerText ||
    "";

  return {
    success: true,
    type: "gmail",
    content: `Subject: ${subject}\n\n${content}`,
    url: window.location.href,
    title: subject || "Gmail",
    isEmail: true,
    isGmail: true,
  };
}

// Google Docs extraction
function extractGoogleDocs() {
  console.log("[Content Script] Extracting Google Docs content...");

  const docId = window.location.pathname.split("/d/")[1]?.split("/")[0];

  if (!docId) {
    return {
      success: false,
      error: "Could not extract document ID",
    };
  }

  return {
    success: true,
    type: "gdocs",
    docId: docId,
    url: window.location.href,
    title: document.title,
    requiresBackgroundExtraction: true,
  };
}

// SharePoint extraction
function extractSharePoint() {
  console.log("[Content Script] Extracting SharePoint content...");

  const mainContent =
    document.querySelector('[role="main"]') ||
    document.querySelector(".od-ItemsScopeList") ||
    document.querySelector("#contentBox");

  const content = mainContent
    ? mainContent.innerText || mainContent.textContent || ""
    : document.body.innerText;

  return {
    success: true,
    type: "sharepoint",
    content: content.substring(0, 10000),
    url: window.location.href,
    title: document.title,
  };
}

// Generic web page extraction
function extractGeneric() {
  console.log("[Content Script] Extracting generic content...");

  const mainContent =
    document.querySelector("main") ||
    document.querySelector('[role="main"]') ||
    document.querySelector("article") ||
    document.querySelector(".content") ||
    document.body;

  const content = mainContent
    ? mainContent.innerText || mainContent.textContent || ""
    : document.body.innerText;

  return {
    success: true,
    type: "web",
    content: content.substring(0, 10000),
    url: window.location.href,
    title: document.title,
  };
}

// Listen for messages from background/panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("[Content Script] Received message:", request.action);

  if (request.action === "EXTRACT_CONTENT") {
    const result = extractContent();
    sendResponse(result);
    return true;
  }

  return false;
});

console.log("[Content Script] Ready to extract content");
