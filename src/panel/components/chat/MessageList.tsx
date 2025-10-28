// src/panel/components/chat/MessageList.tsx
// Displays list of messages with proper flex layout matching vanilla version

import { useEffect, useRef } from "react";
import type { Message } from "../../types";
import MessageItem from "./MessageItem";

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
      className="chat-container"
      style={{
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        padding: "12px",
        background: "var(--white)", // ✅ Pure white background
      }}
    >
      {messages.length === 0 ? (
        // ✅ Welcome message styled exactly like assistant message
        <div
          className="message assistant"
          style={{
            maxWidth: "85%",
            padding: "12px 14px",
            borderRadius: "var(--r-2xl)",
            fontSize: "14px",
            lineHeight: "1.5",
            alignSelf: "flex-start",
            background: "var(--tint-gray-100)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            animation: "fadeIn 0.3s ease",
          }}
        >
          ✨ Chat bereit! Du kannst jetzt Fragen stellen.
        </div>
      ) : (
        <div
          className="messages"
          style={{
            display: "flex",
            flexDirection: "column", // ✅ CRITICAL: Column layout
            maxWidth: "100%",
          }}
        >
          {messages.map((message, index) => (
            <div
              key={message.id}
              style={{
                marginTop: index > 0 ? "12px" : "0", // ✅ Spacing between messages
              }}
            >
              <MessageItem message={message} />
            </div>
          ))}

          {loading && (
            <div
              className="thinking-indicator"
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 14px",
                marginTop: "12px",
                background: "var(--tint-gray-100)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-2xl)",
                maxWidth: "85%",
              }}
            >
              <div
                className="thinking-content"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  className="thinking-dots"
                  style={{
                    display: "flex",
                    gap: "4px",
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="thinking-dot"
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "var(--text-muted)",
                        animation: "thinkingPulse 1.4s infinite ease-in-out",
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
                <span
                  className="thinking-text"
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "14px",
                    fontStyle: "italic",
                  }}
                >
                  Antwortet...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
}

export default MessageList;
