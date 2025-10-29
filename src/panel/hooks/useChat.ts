// src/panel/hooks/useChat.ts
// Custom hook for chat functionality with context integration

import { useState, useCallback } from "react";
import { sendChatMessage, fetchFolders, fetchRoles } from "../services/api";
import type { Message, ChatPayload } from "../types";
import type { ContextState } from "../types/context";

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [folderId, setFolderId] = useState<string>("");
  const [roleId, setRoleId] = useState<string>("");
  const [model, setModel] = useState({
    id: "gemini-2.5-flash",
    maxLength: 980000,
    name: "Gemini 2.5 Flash",
    tokenLimit: 980000,
  });

  // Initialize folders and roles
  const initialize = useCallback(async () => {
    try {
      console.log("[useChat] Initializing...");

      // Fetch folders
      const folders = await fetchFolders();
      const rootChatFolder = folders.find((f) => f.type === "ROOT_CHAT");
      if (rootChatFolder) {
        setFolderId(rootChatFolder.id);
        console.log("[useChat] Folder ID set:", rootChatFolder.id);
      }

      // Fetch roles
      const roles = await fetchRoles();
      const defaultRole = roles.find((r) => r.defaultRole) || roles[0];
      if (defaultRole) {
        setRoleId(defaultRole.roleId || defaultRole.id);
        console.log(
          "[useChat] Role ID set:",
          defaultRole.roleId || defaultRole.id
        );
      }

      console.log("[useChat] Initialization complete");
    } catch (err) {
      console.error("[useChat] Initialization failed:", err);
      setError("Failed to initialize chat");
    }
  }, []);

  /**
   * Build structured prompt with context
   */
  const buildMessageWithContext = useCallback(
    (userMessage: string, context: ContextState | null): string => {
      // If no context is loaded, return the message as-is
      if (!context || !context.isLoaded || !context.content) {
        return userMessage;
      }

      console.log("[useChat] Building message with context");

      // Build structured prompt with ### headers
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
   * Send a message (with optional context)
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

      // Build the final message content (with context if available)
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

      // Create user message (store original user message for display)
      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "user",
        content, // Display the user's original question
        timestamp: Date.now(),
        references: [],
        sources: [],
      };

      // Add user message to state
      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);
      setError(null);

      try {
        // Determine selectedMode based on whether we're using data collection
        const selectedMode = useDataCollection ? "QA" : "BASIC";

        // Build payload
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
              content: finalContent, // ✨ Send the structured prompt with context!
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

        // Send to API
        const response = await sendChatMessage(payload);
        console.log("[useChat] Response:", response);

        // Parse response
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

        // Create assistant message
        const assistantMessage: Message = {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content: assistantContent,
          timestamp: Date.now(),
          references: [],
          sources: [],
        };

        // Add assistant message
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        console.error("[useChat] Send failed:", err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, folderId, model, roleId, buildMessageWithContext]
  );

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages,
    initialize,
    folderId,
    roleId,
    model,
    setModel,
  };
}
