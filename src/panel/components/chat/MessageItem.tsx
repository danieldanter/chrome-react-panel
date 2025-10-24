// src/panel/components/chat/MessageItem.tsx
// Single message display

import type { Message } from "../../types";

interface MessageItemProps {
  message: Message;
}

function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className="max-w-[85%] px-4 py-3 rounded-2xl"
        style={{
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
        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    </div>
  );
}

export default MessageItem;
