// src/content/extractors/outlook.ts
// Outlook Web App (OWA) content extractor

import { BaseExtractor } from "./base";
import type { ExtractionResult, ExtractionOptions } from "./types";

/**
 * Extractor for Outlook Web App (outlook.office.com, outlook.live.com)
 * Extracts email subject, sender, and body
 */
export class OutlookExtractor extends BaseExtractor {
  /**
   * Detect if current page is Outlook Web App
   */
  detect(): boolean {
    const hostname = window.location.hostname;
    return (
      hostname.includes("outlook.office.com") ||
      hostname.includes("outlook.live.com")
    );
  }

  /**
   * Get site type identifier
   */
  protected getSiteType() {
    return "outlook" as const;
  }

  /**
   * Extract Outlook email content
   */
  extract(options?: ExtractionOptions): ExtractionResult {
    console.log("[OutlookExtractor] Extracting Outlook content");

    try {
      // Extract subject
      const subject = this.extractSubject();

      // Extract email body
      const body = this.extractBody();

      // Extract sender (optional)
      const sender = this.extractSender();

      if (!body && !subject) {
        return this.createErrorResult("No email content found in Outlook");
      }

      // Combine subject and body
      let content = "";
      if (subject) {
        content += `Subject: ${subject}\n\n`;
      }
      if (sender) {
        content += `From: ${sender}\n\n`;
      }
      if (body) {
        content += body;
      }

      const result = this.createBaseResult(content, {
        siteType: "outlook",
        isEmail: true,
        isOutlook: true,
        emailProvider: "outlook",
        extractionMethod: "outlook-dom",
      });

      // Override title with subject if available
      if (subject) {
        result.title = subject;
      }

      return this.applyOptions(result, options);
    } catch (error) {
      console.error("[OutlookExtractor] Extraction failed:", error);
      return this.createErrorResult(
        error instanceof Error ? error.message : "Outlook extraction failed"
      );
    }
  }

  /**
   * Extract email subject from Outlook UI
   */
  private extractSubject(): string {
    // Try multiple subject selectors for different Outlook versions
    const subjectElement = this.querySelector(
      ".SubjectLine", // New Outlook
      '[role="heading"]', // Semantic heading
      ".ReadingPaneSubject", // Reading pane
      '[aria-label*="Subject"]', // Aria label fallback
      "h2" // Generic heading fallback
    );

    if (subjectElement) {
      const subject = this.getTextContent(subjectElement).trim();
      console.log(
        "[OutlookExtractor] Found subject:",
        subject.substring(0, 50)
      );
      return subject;
    }

    // Try to get from page title as last resort
    const titleMatch = document.title.match(/^(.+?)\s*-\s*Outlook/);
    if (titleMatch) {
      return titleMatch[1];
    }

    console.warn("[OutlookExtractor] No subject found");
    return "";
  }

  /**
   * Extract email body from Outlook UI
   */
  private extractBody(): string {
    // Try multiple body selectors
    const bodyElement = this.querySelector(
      '[role="article"]', // Main message article
      ".UniqueMessageBody", // Unique message body
      ".MessageBody", // Generic message body
      ".ReadingPaneContent", // Reading pane content
      '[aria-label*="Message body"]' // Aria label fallback
    );

    if (bodyElement) {
      const body = this.getTextContent(bodyElement);
      console.log("[OutlookExtractor] Found body, length:", body.length);
      return body;
    }

    // Try to get from main content area as fallback
    const mainContent = this.querySelector('[role="main"]');
    if (mainContent) {
      return this.getTextContent(mainContent);
    }

    console.warn("[OutlookExtractor] No body content found");
    return "";
  }

  /**
   * Extract sender email/name
   */
  private extractSender(): string {
    // Try to find sender element
    const senderElement = this.querySelector(
      ".FromField", // From field
      '[aria-label*="From"]', // Aria label
      ".Sender", // Sender class
      '[data-test-id*="sender"]' // Test ID
    );

    if (senderElement) {
      const sender = this.getTextContent(senderElement).trim();
      if (sender) {
        // Clean up common prefixes
        return sender.replace(/^From:\s*/i, "").trim();
      }
    }

    return "";
  }
}
