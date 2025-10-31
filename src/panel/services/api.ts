// src/panel/services/api.ts
// ✅ FIXED: Pass skipCache parameter to background worker for instant auth checks

import { sendToBackground, apiRequest, getStorage } from "./chrome";
import type { ChatPayload, Folder, Role, AuthState } from "../types";

/**
 * Check authentication status
 * @param skipCache - If true, forces background worker to bypass cache
 */
export async function checkAuth(
  skipCache: boolean = false
): Promise<AuthState> {
  try {
    console.log("[API] Checking auth...", { skipCache });

    // ✅ FIXED: Pass skipCache to background worker
    const response = await sendToBackground<AuthState>("CHECK_AUTH", {
      skipCache, // ← This tells background to bypass cache!
    });

    console.log("[API] Auth response:", response);

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
 * Get active domain
 */
export async function getDomain(): Promise<string | null> {
  try {
    const authState = await checkAuth();
    if (authState.domain) {
      return authState.domain;
    }

    return await getStorage<string>("lastKnownDomain");
  } catch (error) {
    console.error("[API] Get domain failed:", error);
    return null;
  }
}

/**
 * Fetch available folders
 */
export async function fetchFolders(): Promise<Folder[]> {
  try {
    const domain = await getDomain();
    if (!domain) {
      console.error("[API] No domain available");
      return [];
    }

    console.log("[API] Fetching folders...");

    // Use generic apiRequest (goes through background worker)
    const response = await apiRequest<{ folders: Folder[] }>(
      `https://${domain}.506.ai/api/folders`,
      {
        method: "GET",
      }
    );

    console.log("[API] Folders response:", response);

    return response.folders || [];
  } catch (error) {
    console.error("[API] Fetch folders failed:", error);
    throw error; // ✅ Throw so useChat can handle 401
  }
}

/**
 * Fetch available roles
 */
export async function fetchRoles(): Promise<Role[]> {
  try {
    const domain = await getDomain();
    if (!domain) {
      console.error("[API] No domain available");
      return [];
    }

    console.log("[API] Fetching roles...");

    const response = await apiRequest<{ roles: Role[] }>(
      `https://${domain}.506.ai/api/roles`,
      {
        method: "GET",
      }
    );

    console.log("[API] Roles response:", response);

    return response.roles || [];
  } catch (error) {
    console.error("[API] Fetch roles failed:", error);
    throw error; // ✅ Throw so useChat can handle 401
  }
}

/**
 * Send chat message
 */
export async function sendChatMessage(payload: ChatPayload): Promise<unknown> {
  try {
    const domain = await getDomain();
    if (!domain) {
      throw new Error("No domain available");
    }

    console.log("[API] Sending chat message...");
    console.log("[API] Payload:", payload);

    const response = await apiRequest(`https://${domain}.506.ai/api/qr/chat`, {
      method: "POST",
      body: payload,
    });

    console.log("[API] Chat response:", response);

    return response;
  } catch (error) {
    console.error("[API] Send chat message failed:", error);
    throw error;
  }
}

/**
 * Get page context from content script
 */
export async function getPageContext(): Promise<{
  success: boolean;
  content?: string;
  url?: string;
  title?: string;
  type?: string;
  error?: string;
}> {
  try {
    console.log("[API] Getting page context...");

    const response = await sendToBackground<{
      success: boolean;
      content?: string;
      url?: string;
      title?: string;
      type?: string;
      error?: string;
    }>("GET_PAGE_CONTEXT");

    console.log("[API] Context response:", response);

    return response;
  } catch (error) {
    console.error("[API] Get page context failed:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
