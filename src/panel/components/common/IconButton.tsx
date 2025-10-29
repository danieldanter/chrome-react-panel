// src/panel/components/common/IconButton.tsx
// Reusable icon button for header
import type { ReactNode } from "react";

interface IconButtonProps {
  icon: ReactNode;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
  title?: string;
}

function IconButton({
  icon,
  active = false,
  danger = false,
  onClick,
  title,
}: IconButtonProps) {
  return (
    <button
      className={`icon-btn ${active ? "active" : ""} ${danger ? "danger" : ""}`}
      onClick={onClick}
      title={title}
      style={{
        width: "32px",
        height: "32px",
        border: "none",
        background: active ? "rgba(14, 165, 233, 0.08)" : "transparent",
        color: active ? "var(--blue-600)" : "var(--text-secondary)",
        cursor: "pointer",
        borderRadius: "var(--r-s)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.15s ease",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "var(--hover-bg)";
          e.currentTarget.style.color = danger
            ? "var(--danger)"
            : "var(--text-primary)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--text-secondary)";
        }
      }}
    >
      {icon}
    </button>
  );
}

export default IconButton;
