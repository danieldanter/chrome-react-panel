// src/panel/components/common/Header.tsx
// Main header with PREVIEW badge, model indicator, and action buttons

import IconButton from "./IconButton";
import type { View } from "../../hooks/useUI";

interface HeaderProps {
  activeView: View;
  onViewChange: (view: View) => void;
  onClearChat: () => void;
  modelName?: string;
}

function Header({
  activeView,
  onViewChange,
  onClearChat,
  modelName = "Gemini 2.5 Flash",
}: HeaderProps) {
  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 12px",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
        minHeight: "44px",
        background: "var(--bg-primary)",
      }}
    >
      {/* Left Side: Badges */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {/* PREVIEW Badge */}
        <span
          style={{
            fontSize: "11px",
            padding: "3px 8px",
            borderRadius: "var(--r-xs)",
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.03em",
            height: "20px",
            display: "inline-flex",
            alignItems: "center",
            lineHeight: 1,
            color: "var(--text-muted)",
            background: "var(--tint-gray-50)",
          }}
        >
          PREVIEW
        </span>

        {/* Model Indicator */}
        <span
          style={{
            fontSize: "11px",
            padding: "3px 8px",
            borderRadius: "var(--r-xs)",
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.03em",
            height: "20px",
            display: "inline-flex",
            alignItems: "center",
            lineHeight: 1,
            color: "var(--blue-600)",
            background: "rgba(14, 165, 233, 0.1)",
            border: "1px solid rgba(14, 165, 233, 0.2)",
            whiteSpace: "nowrap",
          }}
        >
          {modelName}
        </span>
      </div>

      {/* Right Side: Icon Buttons */}
      <div
        style={{
          display: "flex",
          gap: "4px",
        }}
      >
        {/* Chat Button */}
        <IconButton
          icon={
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
            </svg>
          }
          active={activeView === "chat"}
          onClick={() => onViewChange("chat")}
          title="Chat"
        />

        {/* Settings Button */}
        <IconButton
          icon={
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          }
          active={activeView === "settings"}
          onClick={() => onViewChange("settings")}
          title="Einstellungen"
        />

        {/* Clear Chat Button */}
        <IconButton
          icon={
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          }
          danger
          onClick={onClearChat}
          title="Chat löschen"
        />
      </div>
    </header>
  );
}

export default Header;
