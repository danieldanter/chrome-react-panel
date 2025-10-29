// src/panel/components/input/ContextBar.tsx
// Beautiful light blue context bar with document icon

import type { ContextState } from "../../types/context";

interface ContextBarProps {
  context: ContextState;
  onClear: () => void;
}

function ContextBar({ context, onClear }: ContextBarProps) {
  if (!context.isLoaded) return null;

  // Build context info text
  let contextInfo = context.title || "Untitled";
  if (context.wordCount > 0) {
    contextInfo += ` (${context.wordCount} Wörter)`;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        padding: "10px 12px",
        background: "rgba(14, 165, 233, 0.08)",
        border: "1px solid rgba(14, 165, 233, 0.2)",
        borderRadius: "var(--r-l)",
        animation: "slideIn 0.3s ease",
      }}
    >
      {/* Context Info Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {/* Document Icon */}
        <span
          style={{
            fontSize: "16px",
            flexShrink: 0,
          }}
        >
          📄
        </span>

        {/* Context Text */}
        <span
          style={{
            flex: 1,
            fontSize: "13px",
            color: "var(--text-primary)",
            fontWeight: 500,
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
            width: "20px",
            height: "20px",
            border: "none",
            background: "transparent",
            color: "var(--text-muted)",
            cursor: "pointer",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
            lineHeight: 1,
            transition: "all 0.15s ease",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
            e.currentTarget.style.color = "var(--danger)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          ✕
        </button>
      </div>

      {/* Action Buttons Row (only for emails - future implementation) */}
      {(context.isEmail || context.isGmail || context.isOutlook) && (
        <div
          style={{
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
            paddingTop: "8px",
            borderTop: "1px solid rgba(14, 165, 233, 0.15)",
          }}
        >
          <button
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 10px",
              border: "1px solid rgba(14, 165, 233, 0.3)",
              background: "rgba(14, 165, 233, 0.05)",
              color: "var(--blue-600)",
              borderRadius: "var(--r-s)",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(14, 165, 233, 0.12)";
              e.currentTarget.style.borderColor = "var(--blue-500)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(14, 165, 233, 0.05)";
              e.currentTarget.style.borderColor = "rgba(14, 165, 233, 0.3)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <svg
              width="14"
              height="14"
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
            <span>Zusammenfassen</span>
          </button>

          <button
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 10px",
              border: "1px solid rgba(14, 165, 233, 0.3)",
              background: "rgba(14, 165, 233, 0.05)",
              color: "var(--blue-600)",
              borderRadius: "var(--r-s)",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(14, 165, 233, 0.12)";
              e.currentTarget.style.borderColor = "var(--blue-500)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(14, 165, 233, 0.05)";
              e.currentTarget.style.borderColor = "rgba(14, 165, 233, 0.3)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <span>Antworten</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default ContextBar;
