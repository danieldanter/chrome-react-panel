// src/content/extractors/base.ts
// Base extractor class with shared utilities

import type {
  IExtractor,
  ExtractionResult,
  ExtractionOptions,
  ExtractionMetadata,
} from "./types";

/**
 * Abstract base class for all extractors
 * Provides common utilities for text processing and extraction
 */
export abstract class BaseExtractor implements IExtractor {
  /**
   * Check if this extractor can handle the current page
   * Must be implemented by subclasses
   */
  abstract detect(): boolean;

  /**
   * Extract content from the current page
   * Must be implemented by subclasses
   */
  abstract extract(options?: ExtractionOptions): ExtractionResult;

  /**
   * Get the site type identifier
   * Should be overridden by subclasses
   */
  protected abstract getSiteType(): ExtractionMetadata["siteType"];

  /**
   * Clean text by removing excess whitespace and normalizing line breaks
   */
  protected cleanText(text: string): string {
    if (!text) return "";

    return text
      .replace(/\s+/g, " ") // Collapse multiple spaces
      .replace(/\n\s*\n/g, "\n") // Remove empty lines
      .replace(/^\s+|\s+$/g, "") // Trim start/end
      .trim();
  }

  /**
   * Get currently selected text from the page
   */
  protected getSelectedText(): string {
    try {
      const selection = window.getSelection();
      return selection ? selection.toString().trim() : "";
    } catch (error) {
      console.error("[Extractor] Failed to get selected text:", error);
      return "";
    }
  }

  /**
   * Truncate text to a maximum length, trying to break at sentence boundaries
   */
  protected truncateToLimit(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) {
      return text;
    }

    // Truncate to limit
    let truncated = text.substring(0, maxLength);

    // Try to find the last period (sentence boundary)
    const lastPeriod = truncated.lastIndexOf(".");

    // If we found a period in the last 20% of the text, cut there
    if (lastPeriod > maxLength * 0.8) {
      truncated = truncated.substring(0, lastPeriod + 1);
    }

    return truncated;
  }

  /**
   * Extract domain from current URL
   */
  protected getDomain(): string {
    try {
      return window.location.hostname;
    } catch {
      return "";
    }
  }

  /**
   * Extract text content from an element
   */
  protected getTextContent(element: Element | null): string {
    if (!element) return "";

    try {
      return element.textContent || element.innerHTML || "";
    } catch (error) {
      console.error("[Extractor] Failed to get text content:", error);
      return "";
    }
  }

  /**
   * Try multiple selectors until one matches
   */
  protected querySelector(...selectors: string[]): Element | null {
    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element) return element;
      } catch (error) {
        console.warn(`[Extractor] Invalid selector: ${selector}`, error);
      }
    }
    return null;
  }

  /**
   * Get all matching elements for multiple selectors
   */
  protected querySelectorAll(...selectors: string[]): Element[] {
    const elements: Element[] = [];

    for (const selector of selectors) {
      try {
        const found = document.querySelectorAll(selector);
        elements.push(...Array.from(found));
      } catch (error) {
        console.warn(`[Extractor] Invalid selector: ${selector}`, error);
      }
    }

    return elements;
  }

  /**
   * Create a base extraction result with common fields
   */
  protected createBaseResult(
    content: string,
    metadata: Partial<ExtractionMetadata>
  ): ExtractionResult {
    return {
      success: true,
      title: document.title || "Untitled Page",
      url: window.location.href,
      hostname: window.location.hostname,
      content: this.cleanText(content),
      metadata: {
        siteType: this.getSiteType(),
        extractionMethod: this.constructor.name,
        ...metadata,
      },
    };
  }

  /**
   * Create an error result
   */
  protected createErrorResult(error: string): ExtractionResult {
    return {
      success: false,
      title: document.title || "Error",
      url: window.location.href,
      hostname: window.location.hostname,
      content: "",
      error,
      metadata: {
        siteType: this.getSiteType(),
        extractionMethod: "error",
      },
    };
  }

  /**
   * Apply extraction options (selected text, token limit)
   */
  protected applyOptions(
    result: ExtractionResult,
    options?: ExtractionOptions
  ): ExtractionResult {
    // Include selected text if requested
    if (options?.includeSelected) {
      result.selectedText = this.getSelectedText();
    }

    // Apply token limit if specified
    const maxLength = options?.maxLength || options?.modelLimit;
    if (maxLength && result.content.length > maxLength) {
      const originalLength = result.content.length;
      result.content = this.truncateToLimit(result.content, maxLength);
      result.metadata.originalLength = originalLength;
      result.metadata.truncated = true;
    }

    return result;
  }
}
