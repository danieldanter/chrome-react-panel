// src/panel/types/context.ts
// Context state types

export interface ContextState {
  // Loading states
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;

  // Content data
  title: string;
  url: string;
  domain: string;
  content: string;
  selectedText: string;
  wordCount: number;

  // Page type flags
  isGmail: boolean;
  isOutlook: boolean;
  isEmail: boolean;
  emailProvider: "gmail" | "outlook" | null;
  isGoogleDocs: boolean;

  // Metadata (used by useContext hook)
  timestamp: number;
  extractionMethod: string;
  metadata: Record<string, unknown>;
}

// Note: Component prop interfaces are defined inline in the new components
// (ContextBarProps, MessageInputProps, etc.) so we don't need separate exports
