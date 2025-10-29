// src/content/extractors/generic.ts
// Generic fallback extractor for any webpage

import { BaseExtractor } from "./base";
import type { ExtractionResult, ExtractionOptions } from "./types";

/**
 * Generic extractor that works on any webpage
 * Uses semantic HTML selectors to find main content
 */
export class GenericExtractor extends BaseExtractor {
  /**
   * Always returns true - this is the fallback extractor
   */
  detect(): boolean {
    return true; // Always available as fallback
  }

  /**
   * Get site type identifier
   */
  protected getSiteType() {
    return "web" as const;
  }

  /**
   * Extract content using semantic HTML selectors
   */
  extract(options?: ExtractionOptions): ExtractionResult {
    console.log("[GenericExtractor] Extracting content from generic page");

    try {
      const content = this.extractContent();

      if (!content) {
        return this.createErrorResult("No content found on page");
      }

      const result = this.createBaseResult(content, {
        siteType: "web",
        extractionMethod: "generic-semantic",
      });

      return this.applyOptions(result, options);
    } catch (error) {
      console.error("[GenericExtractor] Extraction failed:", error);
      return this.createErrorResult(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Extract main content using semantic selectors
   * Tries multiple strategies in order of preference
   */
  private extractContent(): string {
    // Strategy 1: Try semantic HTML5 elements
    const mainContent = this.querySelector(
      "main",
      '[role="main"]',
      "article",
      ".main-content",
      ".content",
      "#content",
      "#main"
    );

    if (mainContent) {
      const text = this.getTextContent(mainContent);
      if (text.length > 100) {
        // Ensure we got substantial content
        console.log("[GenericExtractor] Extracted from semantic element");
        return text;
      }
    }

    // Strategy 2: Try to find the largest text block
    const largestBlock = this.findLargestTextBlock();
    if (largestBlock) {
      console.log("[GenericExtractor] Extracted from largest text block");
      return largestBlock;
    }

    // Strategy 3: Fall back to body
    console.log("[GenericExtractor] Falling back to document.body");
    return this.getTextContent(document.body);
  }

  /**
   * Find the element with the most text content
   * Useful for pages without semantic HTML
   */
  private findLargestTextBlock(): string {
    try {
      // Get all divs, sections, and articles
      const candidates = this.querySelectorAll("div", "section", "article");

      let maxLength = 0;
      let largestElement: Element | null = null;

      for (const element of candidates) {
        const text = this.getTextContent(element);
        if (text.length > maxLength) {
          maxLength = text.length;
          largestElement = element;
        }
      }

      // Only return if we found something substantial
      if (largestElement && maxLength > 200) {
        return this.getTextContent(largestElement);
      }
    } catch (error) {
      console.error("[GenericExtractor] Failed to find largest block:", error);
    }

    return "";
  }
}
