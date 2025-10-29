// src/content/extractors/sharepoint.ts
// SharePoint and Office.com content extractor

import { BaseExtractor } from "./base";
import type { ExtractionResult, ExtractionOptions } from "./types";

/**
 * Extractor for SharePoint and Office.com
 * Handles both regular pages and document viewers
 */
export class SharePointExtractor extends BaseExtractor {
  /**
   * Detect if current page is SharePoint or Office.com
   */
  detect(): boolean {
    const hostname = window.location.hostname;
    return (
      hostname.includes("sharepoint.com") ||
      hostname.includes("office.com") ||
      hostname.includes("office365.com")
    );
  }

  /**
   * Get site type identifier
   */
  protected getSiteType() {
    return "sharepoint" as const;
  }

  /**
   * Extract SharePoint content
   */
  extract(options?: ExtractionOptions): ExtractionResult {
    console.log("[SharePointExtractor] Extracting SharePoint content");

    try {
      // Check if this is a document viewer
      if (this.isDocumentViewer()) {
        return this.extractDocument(options);
      }

      // Otherwise extract page content
      return this.extractPageContent(options);
    } catch (error) {
      console.error("[SharePointExtractor] Extraction failed:", error);
      return this.createErrorResult(
        error instanceof Error ? error.message : "SharePoint extraction failed"
      );
    }
  }

  /**
   * Check if current page is a document viewer
   */
  private isDocumentViewer(): boolean {
    // Check URL for document viewer indicators
    return (
      window.location.pathname.includes("_layouts/15/Doc.aspx") ||
      window.location.pathname.includes("_layouts/15/WopiFrame.aspx") ||
      window.location.search.includes("sourcedoc=")
    );
  }

  /**
   * Extract document content (Word, Excel, PowerPoint, etc.)
   */
  private extractDocument(options?: ExtractionOptions): ExtractionResult {
    console.log("[SharePointExtractor] Detected document viewer");

    // Try to extract WOPI context for API extraction
    const wopiContext = this.extractWopiContext();
    const fileName = this.extractFileName();
    const documentUrl = this.extractDocumentUrl();

    // For documents, we need the background worker to extract via WOPI API
    const result = this.createBaseResult("Document content loading...", {
      siteType: "sharepoint",
      isDocument: true,
      needsApiExtraction: true, // ⚠️ CRITICAL: Signals background to use WOPI API
      fileName: fileName || "Unknown Document",
      documentUrl: documentUrl || window.location.href,
      sourceDoc: wopiContext || "",
      extractionMethod: "sharepoint-document",
    });

    if (fileName) {
      result.title = fileName;
    }

    return this.applyOptions(result, options);
  }

  /**
   * Extract regular SharePoint page content
   */
  private extractPageContent(options?: ExtractionOptions): ExtractionResult {
    console.log("[SharePointExtractor] Extracting page content");

    // Try multiple content area selectors
    const contentElement = this.querySelector(
      '[role="main"]', // Main content area
      ".od-ItemsScopeList", // Document library
      "#contentBox", // Content box
      ".ms-webpart-chrome-title", // Web part content
      ".CanvasZone" // Modern page canvas
    );

    const content = contentElement
      ? this.getTextContent(contentElement)
      : this.getTextContent(document.body);

    if (!content || content.length < 50) {
      return this.createErrorResult("No SharePoint page content found");
    }

    const result = this.createBaseResult(content, {
      siteType: "sharepoint",
      isDocument: false,
      extractionMethod: "sharepoint-page",
    });

    return this.applyOptions(result, options);
  }

  /**
   * Extract WOPI context from URL parameters
   * Used by background worker to access document via WOPI API
   */
  private extractWopiContext(): string | null {
    try {
      const urlParams = new URLSearchParams(window.location.search);

      // Try different parameter names
      const sourceDoc =
        urlParams.get("sourcedoc") ||
        urlParams.get("sourcedocid") ||
        urlParams.get("docid");

      if (sourceDoc) {
        console.log("[SharePointExtractor] Found WOPI context");
        return sourceDoc;
      }
    } catch (error) {
      console.error(
        "[SharePointExtractor] Failed to extract WOPI context:",
        error
      );
    }

    return null;
  }

  /**
   * Extract document file name
   */
  private extractFileName(): string | null {
    // Try to get from page title
    const title = document.title;
    if (title && !title.includes("SharePoint")) {
      const cleanTitle = title
        .replace(/\s*-\s*.*$/, "") // Remove " - Site Name"
        .trim();

      if (cleanTitle) {
        console.log(
          "[SharePointExtractor] Found file name from title:",
          cleanTitle
        );
        return cleanTitle;
      }
    }

    // Try to get from URL
    const urlMatch = window.location.pathname.match(
      /\/([^/]+)\.(docx?|xlsx?|pptx?|pdf)$/i
    );
    if (urlMatch) {
      console.log(
        "[SharePointExtractor] Found file name from URL:",
        urlMatch[0]
      );
      return urlMatch[0];
    }

    return null;
  }

  /**
   * Extract document URL for API access
   */
  private extractDocumentUrl(): string | null {
    try {
      const urlParams = new URLSearchParams(window.location.search);

      // Try to get file URL parameter
      const fileUrl = urlParams.get("file") || urlParams.get("url");
      if (fileUrl) {
        return decodeURIComponent(fileUrl);
      }

      // Fall back to current URL
      return window.location.href;
    } catch (error) {
      console.error(
        "[SharePointExtractor] Failed to extract document URL:",
        error
      );
    }

    return null;
  }
}
