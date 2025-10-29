// src/panel/components/chat/ChatContainer.tsx
// Main chat container with streaming support

import { useEffect } from "react";
import { useChat } from "../../hooks/useChat";
import { useContext } from "../../hooks/useContext";
import MessageList from "./MessageList";
import InputArea from "../input/InputArea";

function ChatContainer() {
  const {
    messages,
    loading,
    streamingContent,
    sendMessage,
    handleStreamingComplete,
    initialize,
  } = useChat();
  const { context, loadContext, clearContext } = useContext();

  // Initialize chat on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  /**
   * Handle sending message with context
   */
  const handleSendMessage = (content: string) => {
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
          minHeight: 0, // ✅ Critical for nested flex scrolling
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

      {/* Input Area (new component) */}
      <InputArea
        context={context}
        onClearContext={clearContext}
        onLoadContext={loadContext}
        onSend={handleSendMessage}
        disabled={loading || streamingContent !== null}
      />
    </div>
  );
}

export default ChatContainer;
