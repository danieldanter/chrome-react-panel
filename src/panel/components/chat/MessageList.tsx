// src/panel/components/chat/MessageList.tsx
// Displays list of messages with proper flex layout and auto-scroll

import { useEffect, useRef } from "react";
import type { Message } from "../../types";
import MessageItem from "./MessageItem";
import StreamingMessage from "./StreamingMessage";

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  streamingContent?: string | null;
  onStreamingComplete?: () => void;
}

function MessageList({
  messages,
  loading,
  streamingContent,
  onStreamingComplete,
}: MessageListProps) {
  const chatContainerRef = useRef<HTMLDivElement>(null);

  /**
   * Auto-scroll to bottom (matching vanilla version)
   */
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      requestAnimationFrame(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop =
            chatContainerRef.current.scrollHeight;
        }
      });
    }
  };

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-scroll during streaming
  useEffect(() => {
    if (streamingContent) {
      scrollToBottom();
    }
  }, [streamingContent]);

  // Continuous scroll while streaming is active
  useEffect(() => {
    if (streamingContent) {
      const interval = setInterval(scrollToBottom, 100);
      return () => clearInterval(interval);
    }
  }, [streamingContent]);

  return (
    <div
      ref={chatContainerRef}
      className="chat-container"
      style={{
        flex: 1,
        minHeight: 0, // ✅ Alternative to height: 0 - allows flex shrinking
        overflowY: "auto",
        overflowX: "hidden",
        padding: "12px",
        background: "var(--white)",
      }}
    >
      {messages.length === 0 && !loading && !streamingContent ? (
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
            flexDirection: "column",
            maxWidth: "100%",
          }}
        >
          {messages.map((message, index) => (
            <div
              key={message.id}
              style={{
                marginTop: index > 0 ? "12px" : "0",
              }}
            >
              <MessageItem message={message} />
            </div>
          ))}

          {/* Loading indicator (thinking dots) */}
          {loading && !streamingContent && (
            <div
              className="thinking-indicator"
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 14px",
                marginTop: messages.length > 0 ? "12px" : "0",
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
                  Denkt nach...
                </span>
              </div>
            </div>
          )}

          {/* Streaming message */}
          {streamingContent && (
            <div style={{ marginTop: messages.length > 0 ? "12px" : "0" }}>
              <StreamingMessage
                content={streamingContent}
                speed={3}
                onComplete={onStreamingComplete}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MessageList;
