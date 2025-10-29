// src/content/extractors/gdocs.ts
// Google Docs content extractor

import { BaseExtractor } from "./base";
import type { ExtractionResult, ExtractionOptions } from "./types";

/**
 * Extractor for Google Docs
 * Extracts visible content and signals background worker to use export API
 */
export class GDocsExtractor extends BaseExtractor {
  /**
   * Detect if current page is Google Docs
   */
  detect(): boolean {
    return window.location.hostname.includes("docs.google.com");
  }

  /**
   * Get site type identifier
   */
  protected getSiteType() {
    return "gdocs" as const;
  }

  /**
   * Extract Google Docs content
   */
  extract(options?: ExtractionOptions): ExtractionResult {
    console.log("[GDocsExtractor] Extracting Google Docs content");

    try {
      // Extract document ID from URL
      const docId = this.extractDocId();

      if (!docId) {
        return this.createErrorResult("Could not extract document ID from URL");
      }

      // Extract visible content (may be incomplete due to lazy loading)
      const visibleContent = this.extractVisibleContent();

      // Extract document title
      const title = this.extractTitle();

      // Create result with needsExport flag
      // This signals the background worker to call Google Docs export API
      const result = this.createBaseResult(visibleContent || "Loading...", {
        siteType: "gdocs",
        isGoogleDocs: true,
        docId: docId,
        needsExport: true, // ⚠️ CRITICAL: Signals background to fetch full text
        extractionMethod: "gdocs-dom",
      });

      // Override title if we found it
      if (title) {
        result.title = title;
      }

      return this.applyOptions(result, options);
    } catch (error) {
      console.error("[GDocsExtractor] Extraction failed:", error);
      return this.createErrorResult(
        error instanceof Error ? error.message : "Google Docs extraction failed"
      );
    }
  }

  /**
   * Extract document ID from URL
   * URL format: https://docs.google.com/document/d/{docId}/edit
   */
  private extractDocId(): string | null {
    try {
      const urlMatch = window.location.pathname.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (urlMatch && urlMatch[1]) {
        const docId = urlMatch[1];
        console.log("[GDocsExtractor] Found document ID:", docId);
        return docId;
      }
    } catch (error) {
      console.error("[GDocsExtractor] Failed to extract doc ID:", error);
    }

    return null;
  }

  /**
   * Extract visible content from Google Docs UI
   * Note: This may be incomplete due to lazy loading!
   * The background worker will fetch the full text via export API
   */
  private extractVisibleContent(): string {
    // Try to get content from the document canvas
    const contentElement = this.querySelector(
      ".kix-page-content-wrapper", // Main content wrapper
      ".kix-page", // Individual pages
      ".kix-paginateddocumentplugin" // Document container
    );

    if (contentElement) {
      const content = this.getTextContent(contentElement);
      if (content.length > 0) {
        console.log(
          "[GDocsExtractor] Extracted visible content, length:",
          content.length
        );
        return content;
      }
    }

    console.warn(
      "[GDocsExtractor] No visible content found (may need export API)"
    );
    return "";
  }

  /**
   * Extract document title
   */
  private extractTitle(): string {
    // Try to get title from the title input
    const titleElement = this.querySelector(
      ".docs-title-input", // Title input field
      ".docs-title-outer input", // Alternative title location
      '[aria-label*="title"]' // Aria label fallback
    );

    if (titleElement) {
      // Try to get value from input
      if (titleElement instanceof HTMLInputElement) {
        const title = titleElement.value.trim();
        if (title) {
          console.log("[GDocsExtractor] Found title from input:", title);
          return title;
        }
      }

      // Otherwise get text content
      const title = this.getTextContent(titleElement).trim();
      if (title) {
        console.log("[GDocsExtractor] Found title from text:", title);
        return title;
      }
    }

    // Fall back to page title
    const pageTitle = document.title.replace(" - Google Docs", "").trim();
    if (pageTitle && pageTitle !== "Google Docs") {
      return pageTitle;
    }

    return "Untitled Document";
  }
}
