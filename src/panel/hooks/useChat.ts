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
  const [model, setModel] = useState<string>("gpt-4");

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
    async (content: string, mode: "chat" | "datenspeicher" = "chat") => {
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
        // Build payload
        const payload: ChatPayload = {
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
          name: "Chat",
          roleId,
          selectedAssistantId: "",
          selectedDataCollections: [],
          selectedFiles: [],
          selectedMode: mode,
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
        } else if (response.content) {
          assistantContent = response.content;
        } else if (response.message) {
          assistantContent = response.message;
        } else {
          assistantContent = JSON.stringify(response);
        }

        // Create assistant message
        const assistantMessage: Message = {
          id: `msg-${Date.now()}-assistant`,
          role: "assistant",
          content: assistantContent,
          timestamp: Date.now(),
          references: [],
          sources: [],
        };

        // Add assistant message
        setMessages((prev) => [...prev, assistantMessage]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("[useChat] Send failed:", err);
        setError(err.message || "Failed to send message");

        // Add error message
        const errorMessage: Message = {
          id: `msg-${Date.now()}-error`,
          role: "system",
          content: `❌ Error: ${err.message || "Failed to send message"}`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading, folderId, roleId, model]
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
