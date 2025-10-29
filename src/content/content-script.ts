// src/content/content-script.ts
// Main content script - orchestrates extraction across different sites

import {
  GmailExtractor,
  GDocsExtractor,
  SharePointExtractor,
  OutlookExtractor,
  GenericExtractor,
  type ExtractionResult,
  type ExtractionOptions,
  type IExtractor,
} from "./extractors";

// ---- Augment the Window type (no 'any' needed) -----------------------------
declare global {
  interface Window {
    __companyGPTContentScriptLoaded?: boolean;
  }
}

/**
 * Message types from panel/background
 */
interface ExtractContentMessage {
  action: "EXTRACT_CONTENT";
  options?: ExtractionOptions;
}

interface PingMessage {
  action: "ping";
}

type Message = ExtractContentMessage | PingMessage;

/**
 * Detect which extractor to use for the current page
 */
function detectExtractor(): IExtractor {
  // Try site-specific extractors in order of specificity
  const extractors = [
    new GmailExtractor(),
    new OutlookExtractor(),
    new GDocsExtractor(),
    new SharePointExtractor(),
  ];

  for (const extractor of extractors) {
    if (extractor.detect()) {
      console.log(`[ContentScript] Using ${extractor.constructor.name}`);
      return extractor;
    }
  }

  // Fallback to generic extractor
  console.log("[ContentScript] Using GenericExtractor (fallback)");
  return new GenericExtractor();
}

/**
 * Extract content from current page
 */
function extractContent(options?: ExtractionOptions): ExtractionResult {
  console.log("[ContentScript] Extracting content with options:", options);

  try {
    const extractor = detectExtractor();
    const result = extractor.extract(options);

    console.log("[ContentScript] Extraction result:", {
      success: result.success,
      title: result.title,
      contentLength: result.content.length,
      siteType: result.metadata.siteType,
      hasSelectedText: !!result.selectedText,
    });

    return result;
  } catch (error) {
    console.error("[ContentScript] Extraction failed:", error);
    return {
      success: false,
      title: document.title || "Error",
      url: window.location.href,
      hostname: window.location.hostname,
      content: "",
      error:
        error instanceof Error ? error.message : "Unknown extraction error",
      metadata: {
        siteType: "web",
        extractionMethod: "error",
      },
    };
  }
}

/**
 * Handle messages from panel/background
 */
function handleMessage(
  message: Message,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void
): boolean {
  console.log("[ContentScript] Received message:", message.action);

  try {
    switch (message.action) {
      case "EXTRACT_CONTENT": {
        const result = extractContent(message.options);
        sendResponse(result);
        return true;
      }

      case "ping": {
        // Respond to ping to verify content script is loaded
        sendResponse({ status: "ready" });
        return true;
      }

      default: {
        // Exhaustiveness: if new actions are added but not handled, this runs.
        // Don't access message.action here (it's narrowed to never).
        console.warn("[ContentScript] Unknown action");
        sendResponse({ success: false, error: "Unknown action" });
        return true;
      }
    }
  } catch (error) {
    console.error("[ContentScript] Message handling failed:", error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : "Message handling error",
    });
    return true;
  }
}

/**
 * Initialize content script
 */
function initialize() {
  console.log("[ContentScript] Initializing on:", window.location.hostname);

  // Register message listener
  chrome.runtime.onMessage.addListener(handleMessage);

  console.log("[ContentScript] Ready to extract content ✓");
}

// ---- Guard: prevent multiple initializations -------------------------------
if (window.__companyGPTContentScriptLoaded) {
  console.log("[ContentScript] Already loaded, skipping initialization");
} else {
  window.__companyGPTContentScriptLoaded = true;
  initialize();
}
