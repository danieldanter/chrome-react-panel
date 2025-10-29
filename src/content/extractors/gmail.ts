// src/content/extractors/gmail.ts
// Gmail-specific content extractor

import { BaseExtractor } from "./base";
import type { ExtractionResult, ExtractionOptions } from "./types";

/**
 * Extractor for Gmail emails
 * Extracts subject, sender, body, and thread content
 */
export class GmailExtractor extends BaseExtractor {
  /**
   * Detect if current page is Gmail
   */
  detect(): boolean {
    return window.location.hostname.includes("mail.google.com");
  }

  /**
   * Get site type identifier
   */
  protected getSiteType() {
    return "gmail" as const;
  }

  /**
   * Extract Gmail email content
   */
  extract(options?: ExtractionOptions): ExtractionResult {
    console.log("[GmailExtractor] Extracting Gmail content");

    try {
      // Extract subject
      const subject = this.extractSubject();

      // Extract email body
      const body = this.extractBody();

      // Extract sender (optional)
      const sender = this.extractSender();

      if (!body && !subject) {
        return this.createErrorResult("No email content found");
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
        siteType: "gmail",
        isEmail: true,
        isGmail: true,
        emailProvider: "gmail",
        extractionMethod: "gmail-dom",
      });

      // Override title with subject if available
      if (subject) {
        result.title = subject;
      }

      return this.applyOptions(result, options);
    } catch (error) {
      console.error("[GmailExtractor] Extraction failed:", error);
      return this.createErrorResult(
        error instanceof Error ? error.message : "Gmail extraction failed"
      );
    }
  }

  /**
   * Extract email subject from Gmail UI
   */
  private extractSubject(): string {
    // Try multiple subject selectors
    const subjectElement = this.querySelector(
      "h2.hP", // Primary subject selector
      ".ha h2", // Alternative subject location
      "[data-subject]", // Data attribute fallback
      ".subject" // Generic class fallback
    );

    if (subjectElement) {
      const subject = this.getTextContent(subjectElement).trim();
      console.log("[GmailExtractor] Found subject:", subject.substring(0, 50));
      return subject;
    }

    // Try to get from page title as last resort
    const titleMatch = document.title.match(/^(.+?)\s*-\s*.*@/);
    if (titleMatch) {
      return titleMatch[1];
    }

    console.warn("[GmailExtractor] No subject found");
    return "";
  }

  /**
   * Extract email body from Gmail UI
   */
  private extractBody(): string {
    // Try multiple body selectors in order of preference
    const bodyElement = this.querySelector(
      ".a3s.aiL", // Primary message body
      ".ii.gt", // Alternative body class
      '[role="listitem"] .a3s', // Body in thread
      ".gs .a3s", // Quoted text
      '[role="main"]' // Main content area (fallback)
    );

    if (bodyElement) {
      const body = this.getTextContent(bodyElement);
      console.log("[GmailExtractor] Found body, length:", body.length);
      return body;
    }

    // Try to get entire thread if single message fails
    const thread = this.extractThread();
    if (thread) {
      return thread;
    }

    console.warn("[GmailExtractor] No body content found");
    return "";
  }

  /**
   * Extract entire thread (multiple messages)
   */
  private extractThread(): string {
    const threadMessages = this.querySelectorAll(
      '[role="listitem"]',
      ".message",
      ".thread-item"
    );

    if (threadMessages.length === 0) {
      return "";
    }

    console.log(
      "[GmailExtractor] Found thread with",
      threadMessages.length,
      "messages"
    );

    const messagesText = threadMessages
      .map((msg) => this.getTextContent(msg))
      .filter((text) => text.length > 0)
      .join("\n\n---\n\n");

    return messagesText;
  }

  /**
   * Extract sender email/name
   */
  private extractSender(): string {
    // Try to find sender element
    const senderElement = this.querySelector(
      "span[email]", // Email attribute
      ".gD", // Sender name
      ".go", // Email address
      "[data-hovercard-id]" // Sender with hovercard
    );

    if (senderElement) {
      // Try to get email attribute first
      const email = senderElement.getAttribute("email");
      if (email) {
        return email;
      }

      // Otherwise get text content
      const sender = this.getTextContent(senderElement).trim();
      if (sender) {
        return sender;
      }
    }

    return "";
  }
}
