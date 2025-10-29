// src/panel/hooks/useContext.ts
// Custom hook for context extraction functionality

import { useState, useCallback } from "react";
import { getPageContext } from "../services/api";
import type { ContextState } from "../types/context";

/** Shape returned by the content script when extraction succeeds */
type ContentScriptResponse = {
  title?: string;
  url?: string;
  content?: string;
  mainContent?: string;
  selectedText?: string;
  siteType?: string;
  metadata?: {
    isGmail?: boolean;
    isOutlook?: boolean;
    isEmail?: boolean;
    emailProvider?: "gmail" | "outlook" | string | null;
    isGoogleDocs?: boolean;
    extractionMethod?: string;
    [key: string]: unknown;
  };
};

/**
 * Initial empty context state
 */
const initialContextState: ContextState = {
  isLoaded: false,
  isLoading: false,
  error: null,
  title: "",
  url: "",
  domain: "",
  content: "",
  selectedText: "",
  wordCount: 0,
  isGmail: false,
  isOutlook: false,
  isEmail: false,
  emailProvider: null,
  isGoogleDocs: false,
  timestamp: 0,
  extractionMethod: "",
  metadata: {},
};

export function useContext() {
  const [context, setContext] = useState<ContextState>(initialContextState);

  /**
   * Load context from current page
   */
  const loadContext = useCallback(async () => {
    console.log("[useContext] Loading page context...");

    setContext((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      // Call content script via background worker
      const response = await getPageContext();

      console.log("[useContext] Context response:", response);

      if (!response.success) {
        throw new Error(response.error || "Failed to extract context");
      }

      // Process the response
      const processedContext = processContextResponse(
        response as ContentScriptResponse
      );

      setContext(processedContext);

      console.log("[useContext] Context loaded successfully");
    } catch (error) {
      console.error("[useContext] Failed to load context:", error);

      setContext((prev) => ({
        ...prev,
        isLoading: false,
        isLoaded: false,
        error:
          error instanceof Error ? error.message : "Failed to load context",
      }));
    }
  }, []);

  /**
   * Clear loaded context
   */
  const clearContext = useCallback(() => {
    console.log("[useContext] Clearing context");
    setContext(initialContextState);
  }, []);

  /**
   * Check if context is available
   */
  const hasContext = context.isLoaded && !!context.content;

  /**
   * Type for message context returned by getContextForMessage
   */
  type MessageContext = {
    title: string;
    url: string;
    content: string;
    selectedText: string;
    isEmail: boolean;
    emailProvider: "gmail" | "outlook" | null;
    isGoogleDocs: boolean;
  } | null;

  /**
   * Get context for message (to be included in chat message)
   */
  const getContextForMessage = useCallback((): MessageContext => {
    if (!hasContext) return null; // ✅ FIXED: no `as const` needed

    return {
      title: context.title,
      url: context.url,
      content: context.content,
      selectedText: context.selectedText,
      isEmail: context.isEmail,
      emailProvider: context.emailProvider,
      isGoogleDocs: context.isGoogleDocs,
    };
  }, [context, hasContext]);

  return {
    context,
    loadContext,
    clearContext,
    hasContext,
    getContextForMessage,
  };
}

/**
 * Process raw context response from content script
 */
function processContextResponse(response: ContentScriptResponse): ContextState {
  // Extract domain from URL
  const domain = extractDomain(response.url || "");

  // Get content (might be in 'content' or 'mainContent')
  const content = response.content || response.mainContent || "";

  // Calculate word count
  const wordCount = content
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  // Extract metadata
  const metadata = response.metadata ?? {};

  // Determine page type flags
  const isGmail = Boolean(metadata.isGmail) || response.siteType === "gmail";
  const isOutlook =
    Boolean(metadata.isOutlook) || response.siteType === "outlook";
  const isEmail = Boolean(metadata.isEmail) || isGmail || isOutlook;

  const emailProvider =
    (metadata.emailProvider as "gmail" | "outlook" | null | undefined) ??
    (isGmail ? "gmail" : isOutlook ? "outlook" : null);

  const isGoogleDocs =
    Boolean(metadata.isGoogleDocs) || response.siteType === "gdocs";

  return {
    isLoaded: true,
    isLoading: false,
    error: null,
    title: response.title || "Untitled Page",
    url: response.url || "",
    domain,
    content: cleanText(content),
    selectedText: response.selectedText || "",
    wordCount,
    isGmail,
    isOutlook,
    isEmail,
    emailProvider:
      emailProvider === "gmail" || emailProvider === "outlook"
        ? emailProvider
        : null,
    isGoogleDocs,
    timestamp: Date.now(),
    extractionMethod:
      metadata.extractionMethod || response.siteType || "unknown",
    metadata,
  };
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return "";
  }
}

/**
 * Clean text by removing excess whitespace
 */
function cleanText(text: string): string {
  if (!text) return "";

  return text
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n")
    .trim();
}
