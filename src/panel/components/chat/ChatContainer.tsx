// src/panel/components/chat/ChatContainer.tsx
// Main chat container with context extraction

import { useEffect } from "react";
import { useChat } from "../../hooks/useChat";
import { useContext } from "../../hooks/useContext";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import ContextBar from "../context/ContextBar";

function ChatContainer() {
  const { messages, loading, sendMessage, initialize } = useChat();
  const { context, loadContext, clearContext, hasContext } = useContext();

  // Initialize chat on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} loading={loading} />
      </div>

      {/* Context Bar (appears above input when context is loaded) */}
      {hasContext && (
        <div className="px-4 pb-2">
          <ContextBar context={context} onClear={clearContext} />
        </div>
      )}

      {/* Input Area */}
      <div className="shrink-0">
        <MessageInput
          onSend={sendMessage}
          disabled={loading}
          onLoadContext={loadContext}
          contextLoading={context.isLoading}
          contextLoaded={context.isLoaded}
        />
      </div>
    </div>
  );
}

export default ChatContainer;
