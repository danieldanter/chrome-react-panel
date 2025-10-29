// src/panel/components/chat/ChatContainer.tsx
// Main chat container with authentication-aware behavior

import { useEffect } from "react";
import { useChat } from "../../hooks/useChat";
import { useContext } from "../../hooks/useContext";
import MessageList from "./MessageList";
import InputArea from "../input/InputArea";

interface ChatContainerProps {
  isAuthenticated: boolean;
  authCheckCount: number;
}

function ChatContainer({
  isAuthenticated,
  authCheckCount,
}: ChatContainerProps) {
  const {
    messages,
    loading,
    streamingContent,
    sendMessage,
    handleStreamingComplete,
    initialize,
  } = useChat();

  const { context, loadContext, clearContext } = useContext();

  // Initialize chat on mount AND when auth changes
  useEffect(() => {
    if (isAuthenticated) {
      console.log(
        "[ChatContainer] Initializing chat (auth:",
        isAuthenticated,
        "count:",
        authCheckCount,
        ")"
      );
      initialize();
    }
  }, [initialize, isAuthenticated, authCheckCount]);

  /**
   * Handle sending message with context
   */
  const handleSendMessage = (content: string) => {
    // Don't allow sending if not authenticated
    if (!isAuthenticated) {
      console.warn("[ChatContainer] Cannot send message - not authenticated");
      return;
    }

    console.log("[ChatContainer] Sending message with context:", {
      hasContext: context.isLoaded,
      contextLoaded: context.isLoaded,
      contextLength: context.content?.length || 0,
    });

    // Pass context to sendMessage if it's loaded
    sendMessage(content, context.isLoaded ? context : null);
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Messages Area */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <MessageList
          messages={messages}
          loading={loading}
          streamingContent={streamingContent}
          onStreamingComplete={handleStreamingComplete}
        />
      </div>

      {/* Input Area - DISABLED when not authenticated */}
      <InputArea
        context={context}
        onClearContext={clearContext}
        onLoadContext={loadContext}
        onSend={handleSendMessage}
        disabled={!isAuthenticated || loading || streamingContent !== null}
      />
    </div>
  );
}

export default ChatContainer;
