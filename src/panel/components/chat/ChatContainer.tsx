// src/panel/components/chat/ChatContainer.tsx
// Main chat container component

import { useEffect } from "react";
import { useChat } from "../../hooks/useChat";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

function ChatContainer() {
  const { messages, loading, sendMessage, initialize } = useChat();

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} loading={loading} />
      </div>

      {/* Input Area */}
      <div className="shrink-0">
        <MessageInput onSend={sendMessage} disabled={loading} />
      </div>
    </div>
  );
}

export default ChatContainer;
