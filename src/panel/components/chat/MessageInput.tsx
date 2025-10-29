// src/panel/components/chat/MessageInput.tsx
// Message input area with context button

import { useState } from "react";
import type { KeyboardEvent } from "react";
import LoadContextButton from "../context/LoadContextButton";

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  // Context props
  onLoadContext?: () => void;
  contextLoading?: boolean;
  contextLoaded?: boolean;
}

function MessageInput({
  onSend,
  disabled,
  onLoadContext,
  contextLoading = false,
  contextLoaded = false,
}: MessageInputProps) {
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
      {/* Input Row with Load Context Button */}
      <div className="flex gap-2 items-start mb-2">
        {/* Load Context Button (bottom left) */}
        {onLoadContext && (
          <LoadContextButton
            onClick={onLoadContext}
            loading={contextLoading}
            loaded={contextLoaded}
          />
        )}
      </div>

      {/* Text Area and Send Button Row */}
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
