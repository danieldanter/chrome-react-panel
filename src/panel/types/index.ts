// src/panel/types/index.ts
// All TypeScript interfaces for the application

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  references?: unknown[];
  sources?: unknown[];
}

export interface ChatPayload {
  id: null | string;
  folderId: string;
  messages: {
    role: string;
    content: string;
    references: unknown[];
    sources: unknown[];
  }[];
  model: {
    id: string;
    maxLength: number;
    name: string;
    tokenLimit: number;
  };
  name: string;
  roleId: string;
  selectedAssistantId: string;
  selectedDataCollections: string[];
  selectedFiles: unknown[];
  selectedMode: "BASIC" | "QA" | "chat" | "datenspeicher";
  temperature: number;
}

export interface Folder {
  id: string;
  type: string;
  name: string;
  parentId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Role {
  id: string;
  roleId?: string;
  name: string;
  description?: string;
  defaultRole?: boolean;
  isActive?: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  domain: string | null;
  hasMultipleDomains: boolean;
  availableDomains: string[];
}
