// src/panel/components/context/LoadContextButton.tsx
// Button to load page context

import type { LoadContextButtonProps } from "../../types/context";

function LoadContextButton({
  onClick,
  loading,
  loaded,
}: LoadContextButtonProps) {
  // Define a style type to ensure consistent keys
  interface ButtonStyle {
    padding: string;
    border: string;
    borderRadius: string;
    background: string;
    color: string;
    cursor: string;
    fontSize: string;
    fontWeight: number;
    transition: string;
    display: string;
    alignItems: string;
    gap: string;
    borderColor: string;
  }

  // Determine button state
  const getButtonState = () => {
    if (loading) return "loading";
    if (loaded) return "loaded";
    return "default";
  };

  const state = getButtonState();

  // Button styles based on state
  const getButtonStyles = (): ButtonStyle => {
    const baseStyles: ButtonStyle = {
      padding: "8px 12px",
      border: "1px solid var(--border)",
      borderRadius: "var(--r-m)",
      background: "var(--bg-primary)",
      color: "var(--text-secondary)",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: 500,
      transition: "all 0.2s ease",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      borderColor: "var(--border)", // ✅ added so it's always defined
    };

    switch (state) {
      case "loading":
        return {
          ...baseStyles,
          background: "rgba(14, 165, 233, 0.1)",
          borderColor: "rgba(14, 165, 233, 0.3)",
          color: "var(--blue-600)",
          cursor: "wait",
        };
      case "loaded":
        return {
          ...baseStyles,
          background: "rgba(34, 197, 94, 0.1)",
          borderColor: "rgba(34, 197, 94, 0.3)",
          color: "var(--success)",
        };
      default:
        return baseStyles;
    }
  };

  // Button text based on state
  const getButtonText = () => {
    switch (state) {
      case "loading":
        return "Lade...";
      case "loaded":
        return "Kontext geladen";
      default:
        return "Kontext laden";
    }
  };

  // Icon based on state
  const getIcon = () => {
    switch (state) {
      case "loading":
        return "⏳";
      case "loaded":
        return "✓";
      default:
        return "📄";
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={getButtonStyles()}
      title={
        state === "loaded"
          ? "Kontext geladen - klicken zum Aktualisieren"
          : "Kontext von aktueller Seite laden"
      }
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.background = "rgba(14, 165, 233, 0.1)";
          e.currentTarget.style.borderColor = "var(--blue-500)";
          e.currentTarget.style.color = "var(--blue-600)";
        }
      }}
      onMouseLeave={(e) => {
        if (!loading) {
          const styles = getButtonStyles();
          e.currentTarget.style.background = styles.background;
          e.currentTarget.style.borderColor = styles.borderColor;
          e.currentTarget.style.color = styles.color;
        }
      }}
    >
      <span>{getIcon()}</span>
      <span>{getButtonText()}</span>
    </button>
  );
}

export default LoadContextButton;
