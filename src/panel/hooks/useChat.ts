// src/panel/hooks/useChat.ts
// Custom hook for chat functionality

import { useState, useCallback } from "react";
import { sendChatMessage, fetchFolders, fetchRoles } from "../services/api";
import type { Message, ChatPayload } from "../types";

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

  // Send a message
  const sendMessage = useCallback(
    async (
      content: string,
      useDataCollection: boolean = false,
      dataCollectionId?: string
    ) => {
      if (!content.trim() || loading) return;

      console.log("[useChat] Sending message:", content);

      // Create user message
      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "user",
        content,
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
              content,
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
          selectedMode, // "BASIC" or "QA"
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

        // Add both messages to state
        setMessages((prev) => [...prev, userMessage, assistantMessage]);
      } catch (err) {
        console.error("[useChat] Send failed:", err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, folderId, model, roleId]
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
