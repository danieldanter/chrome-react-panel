// src/panel/components/chat/MessageList.tsx
// Displays list of messages

import { useEffect, useRef } from "react";
import type { Message } from "../../types";
import MessageItem from "./MessageItem.tsx";

interface MessageListProps {
  messages: Message[];
  loading: boolean;
}

function MessageList({ messages, loading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div
      className="h-full overflow-y-auto px-3 py-4"
      style={{ background: "var(--bg-primary)" }}
    >
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div
            className="text-center px-6 py-4 rounded-lg"
            style={{
              background: "var(--tint-gray-100)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
            }}
          >
            <p className="text-lg mb-2">✨</p>
            <p className="font-medium">Chat bereit!</p>
            <p className="text-sm mt-1">Stelle eine Frage...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))}
          {loading && (
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-lg"
              style={{
                background: "var(--tint-gray-100)",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
              }}
            >
              <div className="flex gap-1">
                <span className="animate-bounce">●</span>
                <span
                  className="animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                >
                  ●
                </span>
                <span
                  className="animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                >
                  ●
                </span>
              </div>
              <span className="text-sm">Antwortet...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
}

export default MessageList;
