// src/panel/types/index.ts
// All TypeScript interfaces for the app

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  references?: unknown[];
  sources?: unknown[];
}

export interface ChatPayload {
  folderId: string;
  messages: {
    role: string;
    content: string;
    references: unknown[];
    sources: unknown[];
  }[];
  model: string;
  name: string;
  roleId: string;
  selectedAssistantId: string;
  selectedDataCollections: string[];
  selectedFiles: unknown[];
  selectedMode: "chat" | "datenspeicher";
  temperature: number;
}

export interface PageContext {
  url: string;
  title: string;
  content: string;
  type: "gmail" | "gdocs" | "sharepoint" | "web" | null;
  isEmail?: boolean;
  isGmail?: boolean;
  isOutlook?: boolean;
  emailProvider?: string;
  emailData?: unknown;
}

export interface Folder {
  id: string;
  type: string;
  name: string;
}

export interface Role {
  id: string;
  roleId?: string;
  name: string;
  defaultRole?: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  domain: string | null;
  hasMultipleDomains: boolean;
  availableDomains: string[];
}
