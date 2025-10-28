// src/panel/components/chat/MessageItem.tsx
// Single message display with correct vanilla styling

import type { Message } from "../../types";

interface MessageItemProps {
  message: Message;
}

function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  return (
    <div
      className="message"
      style={{
        maxWidth: "85%",
        padding: "12px 14px",
        borderRadius: "var(--r-2xl)", // ✅ Now correctly 14px
        fontSize: "14px",
        lineHeight: "1.5",
        wordWrap: "break-word",
        animation: "fadeIn 0.3s ease",

        // ✅ CRITICAL FIX: Use align-self for positioning
        alignSelf: isUser ? "flex-end" : "flex-start",
        marginLeft: isUser ? "auto" : "0",
        marginRight: isUser ? "0" : "auto",

        // Backgrounds and borders
        background: isUser
          ? "linear-gradient(180deg, rgba(14, 165, 233, 0.12), rgba(14, 165, 233, 0.06))"
          : isSystem
          ? "rgba(14, 165, 233, 0.05)"
          : "var(--tint-gray-100)",

        border: isUser
          ? "1px solid rgba(14, 165, 233, 0.2)"
          : isSystem
          ? "1px solid var(--blue-500)"
          : "1px solid var(--border)",

        color: "var(--text-primary)",
      }}
    >
      <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {message.content}
      </div>
    </div>
  );
}

export default MessageItem;
