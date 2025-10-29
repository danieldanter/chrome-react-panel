// src/panel/hooks/useChat.ts
// Custom hook for chat functionality with context integration and streaming
// Now includes 401 error handling and optional login overlay trigger

import { useState, useCallback } from "react";
import { sendChatMessage, fetchFolders, fetchRoles } from "../services/api";
import type { Message, ChatPayload } from "../types";
import type { ContextState } from "../types/context";

export function useChat(forceShowLogin?: (reason: string) => void) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [folderId, setFolderId] = useState<string>("");
  const [roleId, setRoleId] = useState<string>("");
  const [model, setModel] = useState({
    id: "gemini-2.5-flash",
    maxLength: 980000,
    name: "Gemini 2.5 Flash",
    tokenLimit: 980000,
  });

  /**
   * Initialize folders and roles
   * Now includes 401 handling
   */
  const initialize = useCallback(async () => {
    try {
      console.log("[useChat] Initializing...");

      // Fetch folders
      try {
        const folders = await fetchFolders();
        const rootChatFolder = folders.find((f) => f.type === "ROOT_CHAT");
        if (rootChatFolder) {
          setFolderId(rootChatFolder.id);
          console.log("[useChat] Folder ID set:", rootChatFolder.id);
        }
      } catch (err) {
        const errorMessage = (err as Error).message || "";
        if (errorMessage.includes("401")) {
          console.log("[useChat] 401 on fetchFolders - triggering login");
          if (forceShowLogin) {
            forceShowLogin("Sitzung abgelaufen. Bitte erneut anmelden.");
          }
          return; // Stop initialization
        }
      }

      // Fetch roles
      try {
        const roles = await fetchRoles();
        const defaultRole = roles.find((r) => r.defaultRole) || roles[0];
        if (defaultRole) {
          setRoleId(defaultRole.roleId || defaultRole.id);
          console.log(
            "[useChat] Role ID set:",
            defaultRole.roleId || defaultRole.id
          );
        }
      } catch (err) {
        const errorMessage = (err as Error).message || "";
        if (errorMessage.includes("401")) {
          console.log("[useChat] 401 on fetchRoles - triggering login");
          if (forceShowLogin) {
            forceShowLogin("Sitzung abgelaufen. Bitte erneut anmelden.");
          }
          return; // Stop initialization
        }
      }

      console.log("[useChat] Initialization complete");
    } catch (err) {
      console.error("[useChat] Initialization failed:", err);
      setError("Failed to initialize chat");
    }
  }, [forceShowLogin]);

  /**
   * Build structured prompt with context
   */
  const buildMessageWithContext = useCallback(
    (userMessage: string, context: ContextState | null): string => {
      if (!context || !context.isLoaded || !context.content) {
        return userMessage;
      }

      console.log("[useChat] Building message with context");

      const structuredPrompt = `### Kontext von der Webseite ###
Titel: ${context.title}
URL: ${context.url}
Domain: ${context.domain}
${context.selectedText ? `\nMarkierter Text:\n${context.selectedText}\n` : ""}
Seiteninhalt:
"""
${context.content}
"""

### Benutzerfrage ###
${userMessage}

### Antwort ###
Beantworte die Frage des Benutzers basierend auf dem bereitgestellten Kontext von der Webseite. Gib eine klare, präzise Antwort.`;

      return structuredPrompt;
    },
    []
  );

  /**
   * Handle streaming complete - add message to history
   */
  const handleStreamingComplete = useCallback(() => {
    if (streamingContent) {
      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: streamingContent,
        timestamp: Date.now(),
        references: [],
        sources: [],
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent(null);
    }
  }, [streamingContent]);

  /**
   * Send a message (with optional context)
   * Now includes 401 handling
   */
  const sendMessage = useCallback(
    async (
      content: string,
      pageContext?: ContextState | null,
      useDataCollection: boolean = false,
      dataCollectionId?: string
    ) => {
      if (!content.trim() || loading) return;

      console.log("[useChat] Sending message:", content);

      const finalContent = buildMessageWithContext(
        content,
        pageContext || null
      );

      console.log(
        "[useChat] Context included:",
        pageContext?.isLoaded ? "YES ✅" : "NO"
      );
      console.log(
        "[useChat] Final message length:",
        finalContent.length,
        "chars"
      );

      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "user",
        content,
        timestamp: Date.now(),
        references: [],
        sources: [],
      };

      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);
      setError(null);

      try {
        const selectedMode = useDataCollection ? "QA" : "BASIC";

        const payload: ChatPayload = {
          id: null,
          folderId,
          messages: [
            ...messages.map((msg) => ({
              role: msg.role,
              content: msg.content,
              references: msg.references || [],
              sources: msg.sources || [],
            })),
            {
              role: "user",
              content: finalContent,
              references: [],
              sources: [],
            },
          ],
          model,
          name: "Neuer Chat",
          roleId,
          selectedAssistantId: "",
          selectedDataCollections:
            useDataCollection && dataCollectionId ? [dataCollectionId] : [],
          selectedFiles: [],
          selectedMode,
          temperature: 0.2,
        };

        console.log("[useChat] Payload:", payload);

        const response = await sendChatMessage(payload);
        console.log("[useChat] Response:", response);

        let assistantContent = "";

        if (typeof response === "string") {
          assistantContent = response;
        } else if (response && typeof response === "object") {
          const apiResponse = response as {
            content?: string;
            message?: string;
          };

          if (apiResponse.content) {
            assistantContent = apiResponse.content;
          } else if (apiResponse.message) {
            assistantContent = apiResponse.message;
          } else {
            assistantContent = JSON.stringify(response);
          }
        } else {
          assistantContent = JSON.stringify(response);
        }

        setLoading(false);
        setStreamingContent(assistantContent);
      } catch (err) {
        console.error("[useChat] Send failed:", err);

        const errorMessage = (err as Error).message || "";

        // ✅ Handle 401 Unauthorized
        if (errorMessage.includes("401") || errorMessage.includes("HTTP 401")) {
          console.log("[useChat] 401 error detected - triggering login");

          if (forceShowLogin) {
            forceShowLogin("Sitzung abgelaufen. Bitte erneut anmelden.");
          }

          setError("Sitzung abgelaufen. Bitte erneut anmelden.");
        } else {
          setError(errorMessage);
        }

        setLoading(false);
      }
    },
    [
      loading,
      messages,
      folderId,
      model,
      roleId,
      buildMessageWithContext,
      forceShowLogin,
    ]
  );

  /**
   * Clear chat messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setStreamingContent(null);
    setError(null);
  }, []);

  return {
    messages,
    loading,
    streamingContent,
    error,
    sendMessage,
    clearMessages,
    initialize,
    handleStreamingComplete,
    folderId,
    roleId,
    model,
    setModel,
  };
}
