// src/content/extractors/types.ts
// TypeScript interfaces for content extraction

/**
 * Metadata about the extracted content
 */
export interface ExtractionMetadata {
  // Site identification
  siteType: "gmail" | "gdocs" | "sharepoint" | "outlook" | "web";
  extractionMethod: string;

  // Email flags
  isEmail?: boolean;
  isGmail?: boolean;
  isOutlook?: boolean;
  emailProvider?: "gmail" | "outlook" | null;

  // Document flags
  isGoogleDocs?: boolean;
  isDocument?: boolean;

  // Enhancement flags (for background worker)
  needsExport?: boolean; // Google Docs needs export API
  needsApiExtraction?: boolean; // SharePoint needs WOPI API

  // Document metadata (for SharePoint)
  docId?: string; // Google Docs document ID
  fileName?: string; // SharePoint file name
  documentUrl?: string; // SharePoint document URL
  sourceDoc?: string; // SharePoint WOPI context

  // Content info
  originalLength?: number; // Original content length before truncation
  truncated?: boolean; // Was content truncated?

  // Additional metadata
  [key: string]: unknown; // Allow additional fields
}

/**
 * Result of content extraction
 */
export interface ExtractionResult {
  success: boolean;
  title: string;
  url: string;
  content: string; // Main page content
  selectedText?: string; // User-selected text
  hostname?: string; // For convenience
  error?: string; // Error message if extraction failed
  metadata: ExtractionMetadata;
}

/**
 * Options for extraction
 */
export interface ExtractionOptions {
  includeSelected?: boolean; // Include window.getSelection()
  maxLength?: number; // Token limit (from model)
  modelLimit?: number; // Alternative name for maxLength
}

/**
 * Base extractor interface
 */
export interface IExtractor {
  /**
   * Check if this extractor can handle the current page
   */
  detect(): boolean;

  /**
   * Extract content from the current page
   */
  extract(options?: ExtractionOptions): ExtractionResult;
}
