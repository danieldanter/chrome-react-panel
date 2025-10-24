// src/panel/components/chat/MessageInput.tsx
// Message input area

import { useState } from "react";
import type { KeyboardEvent } from "react";

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim() || disabled) return;
    onSend(input);
    setInput("");
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="border-t px-4 py-3"
      style={{
        borderColor: "var(--border)",
        background: "var(--bg-primary)",
      }}
    >
      <div className="flex gap-2 items-end">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Nachricht eingeben... (Enter zum Senden, Shift+Enter für neue Zeile)"
          disabled={disabled}
          rows={3}
          className="flex-1 px-3 py-2 rounded-lg resize-none focus:outline-none text-sm"
          style={{
            border: "1px solid var(--border)",
            background: "var(--bg-secondary)",
            color: "var(--text-primary)",
          }}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className="px-6 py-2 rounded-lg font-medium text-sm transition-all"
          style={{
            background:
              disabled || !input.trim()
                ? "var(--tint-gray-100)"
                : "var(--blue-500)",
            color: disabled || !input.trim() ? "var(--text-muted)" : "white",
            cursor: disabled || !input.trim() ? "not-allowed" : "pointer",
            opacity: disabled || !input.trim() ? 0.5 : 1,
          }}
        >
          Senden
        </button>
      </div>
    </div>
  );
}

export default MessageInput;
