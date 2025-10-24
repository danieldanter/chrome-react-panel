// src/panel/services/api.ts
// Communication with CompanyGPT API

import { sendToBackground, getStorage, setStorage } from "./chrome";
import type { ChatPayload, Folder, Role, AuthState } from "../types";

/**
 * Check authentication status
 */
export async function checkAuth(): Promise<AuthState> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await sendToBackground<any>("CHECK_AUTH");
    return {
      isAuthenticated: response.isAuthenticated || false,
      domain: response.domain || null,
      hasMultipleDomains: response.hasMultipleDomains || false,
      availableDomains: response.availableDomains || [],
    };
  } catch (error) {
    console.error("[API] Check auth failed:", error);
    return {
      isAuthenticated: false,
      domain: null,
      hasMultipleDomains: false,
      availableDomains: [],
    };
  }
}

/**
 * Fetch available folders
 */
export async function fetchFolders(): Promise<Folder[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await sendToBackground<any>("FETCH_FOLDERS");
    return response.folders || [];
  } catch (error) {
    console.error("[API] Fetch folders failed:", error);
    return [];
  }
}

/**
 * Fetch available roles
 */
export async function fetchRoles(): Promise<Role[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await sendToBackground<any>("FETCH_ROLES");
    return response.roles || [];
  } catch (error) {
    console.error("[API] Fetch roles failed:", error);
    return [];
  }
}

/**
 * Send chat message
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendChatMessage(payload: ChatPayload): Promise<any> {
  try {
    console.log("[API] Sending chat message:", payload);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await sendToBackground<any>("SEND_CHAT_MESSAGE", payload);
    return response;
  } catch (error) {
    console.error("[API] Send chat message failed:", error);
    throw error;
  }
}

/**
 * Get domain from storage
 */
export async function getDomain(): Promise<string | null> {
  return await getStorage<string>("activeDomain");
}

/**
 * Set domain in storage
 */
export async function setDomain(domain: string): Promise<void> {
  await setStorage("activeDomain", domain);
}
