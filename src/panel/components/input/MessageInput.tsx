// src/panel/components/input/MessageInput.tsx
// ✅ FIXED: Better initial height handling after authentication
// Message input with context load button (left) and send button (right)

import { useState, useRef, useEffect } from "react";
import type { KeyboardEvent, ChangeEvent } from "react";
import { useAutoResize } from "../../hooks/useAutoResize";

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  onLoadContext: () => void;
  contextLoading?: boolean;
  contextLoaded?: boolean;
}

function MessageInput({
  onSend,
  disabled = false,
  onLoadContext,
  contextLoading = false,
  contextLoaded = false,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useAutoResize(textareaRef, 100);

  /**
   * ✅ NEW: Force resize when disabled state changes (after authentication)
   * This fixes the double-height issue after login
   */
  useEffect(() => {
    if (!disabled && textareaRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
          const newHeight = Math.min(textareaRef.current.scrollHeight, 100);
          textareaRef.current.style.height = `${newHeight}px`;

          console.log("[MessageInput] Reset height after auth:", newHeight);
        }
      }, 100);
    }
  }, [disabled]); // Run when disabled state changes

  const handleSend = () => {
    if (!message.trim() || disabled) return;

    onSend(message);
    setMessage("");

    // Reset height after sending
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";

      // Small delay to ensure state update
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      }, 0);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const getContextButtonStyle = () => {
    const baseStyle = {
      position: "absolute" as const,
      left: "6px",
      bottom: "6px",
      width: "28px",
      height: "28px",
      border: "none",
      background: "transparent",
      color: "var(--text-muted)",
      borderRadius: "50%",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s",
      flexShrink: 0,
      zIndex: 10,
    };

    if (contextLoading) {
      return {
        ...baseStyle,
        color: "var(--blue-600)",
        animation: "spin 1s linear infinite",
      };
    }

    if (contextLoaded) {
      return {
        ...baseStyle,
        background: "rgba(14, 165, 233, 0.1)",
        color: "var(--blue-600)",
      };
    }

    return baseStyle;
  };

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "flex-end",
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-3xl)",
        transition: "border-color 0.2s, box-shadow 0.2s",
        paddingLeft: "4px",
        width: "100%",
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "var(--blue-500)";
        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(14, 165, 233, 0.1)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Context Load Button */}
      <button
        onClick={onLoadContext}
        disabled={contextLoading}
        title={
          contextLoading
            ? "Lädt Kontext..."
            : contextLoaded
            ? "Kontext geladen - klicken zum Aktualisieren"
            : "Seitenkontext laden"
        }
        style={getContextButtonStyle()}
        onMouseEnter={(e) => {
          if (!contextLoading && !contextLoaded) {
            e.currentTarget.style.background = "var(--hover-bg)";
            e.currentTarget.style.color = "var(--text-primary)";
            e.currentTarget.style.transform = "scale(1.05)";
          }
        }}
        onMouseLeave={(e) => {
          if (!contextLoading && !contextLoaded) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-muted)";
            e.currentTarget.style.transform = "scale(1)";
          }
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14,2 14,8 20,8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
      </button>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Nachricht an CompanyGPT"
        disabled={disabled}
        rows={1}
        style={{
          flex: 1,
          padding: "8px 40px",
          border: "none",
          background: "transparent",
          resize: "none",
          outline: "none",
          fontFamily: "inherit",
          fontSize: "14px",
          color: "var(--text-primary)",
          maxHeight: "100px",
          lineHeight: 1.5,
          minHeight: "20px", // ✅ Keep small initial height
          height: "20px", // ✅ Start with 20px height
          overflowY: "hidden",
        }}
      />

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={!message.trim() || disabled}
        title="Senden"
        style={{
          position: "absolute",
          right: "6px",
          bottom: "6px",
          width: "28px",
          height: "28px",
          border: "none",
          background:
            !message.trim() || disabled ? "var(--border)" : "var(--blue-600)",
          color: "var(--white)",
          borderRadius: "50%",
          cursor: !message.trim() || disabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s",
          flexShrink: 0,
          zIndex: 10,
          opacity: !message.trim() || disabled ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (message.trim() && !disabled) {
            e.currentTarget.style.background = "var(--blue-500)";
            e.currentTarget.style.transform = "scale(1.05)";
          }
        }}
        onMouseLeave={(e) => {
          if (message.trim() && !disabled) {
            e.currentTarget.style.background = "var(--blue-600)";
            e.currentTarget.style.transform = "scale(1)";
          }
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  );
}

export default MessageInput;
