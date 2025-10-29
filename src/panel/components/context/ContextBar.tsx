// src/panel/components/context/ContextBar.tsx
// Context bar that displays loaded page context

import type { ContextBarProps } from "../../types/context";

function ContextBar({ context, onClear }: ContextBarProps) {
  if (!context.isLoaded) {
    return null;
  }

  // Build context info text
  let contextInfo = context.title || "Untitled";

  if (context.wordCount > 0) {
    contextInfo += ` (${context.wordCount} Wörter)`;
  }

  // Add provider info for emails
  if (context.isEmail) {
    if (context.isGmail) {
      contextInfo += " • Gmail";
    } else if (context.isOutlook) {
      contextInfo += " • Outlook";
    } else if (context.emailProvider) {
      contextInfo += ` • ${context.emailProvider}`;
    } else {
      contextInfo += " • Email";
    }
  } else if (context.isGoogleDocs) {
    contextInfo += " • Google Docs";
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        padding: "8px 12px",
        background: "rgba(14, 165, 233, 0.08)",
        border: "1px solid rgba(14, 165, 233, 0.2)",
        borderRadius: "var(--r-l)",
        animation: "slideDown 0.3s ease",
        width: "100%",
      }}
    >
      {/* Context Info Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          minHeight: "20px",
        }}
      >
        {/* Icon */}
        <span
          style={{
            fontSize: "14px",
            flexShrink: 0,
          }}
        >
          📄
        </span>

        {/* Context Text */}
        <span
          style={{
            color: "var(--text-secondary)",
            fontWeight: 500,
            fontSize: "13px",
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {contextInfo}
        </span>

        {/* Close Button */}
        <button
          onClick={onClear}
          title="Kontext entfernen"
          style={{
            width: "18px",
            height: "18px",
            border: "none",
            background: "transparent",
            color: "var(--text-muted)",
            cursor: "pointer",
            borderRadius: "var(--r-xs)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
            flexShrink: 0,
            fontSize: "14px",
            lineHeight: 1,
            padding: 0,
            opacity: 0.6,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
            e.currentTarget.style.color = "var(--danger)";
            e.currentTarget.style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-muted)";
            e.currentTarget.style.opacity = "0.6";
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default ContextBar;
