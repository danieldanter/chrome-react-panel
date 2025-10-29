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

  // Metadata
  timestamp: number;
  extractionMethod: string;
  metadata: Record<string, unknown>;
}

export interface ContextBarProps {
  context: ContextState;
  onClear: () => void;
}

export interface LoadContextButtonProps {
  onClick: () => void;
  loading: boolean;
  loaded: boolean;
}

export interface ContextActionsProps {
  visible: boolean;
  isEmail: boolean;
  isDocument: boolean;
  onAction: (action: string) => void;
  loading: boolean;
}
