// src/panel/Panel.tsx
// Main panel component

import { useState } from "react";
import ChatContainer from "./components/chat/ChatContainer.tsx";

function Panel() {
  const [view, setView] = useState<"chat" | "settings">("chat");

  return (
    <div
      className="h-screen flex flex-col"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Header */}
      <header
        className="flex justify-between items-center px-4 py-3 border-b"
        style={{
          borderColor: "var(--border)",
          background: "var(--bg-primary)",
          minHeight: "44px",
        }}
      >
        <div className="flex items-center gap-2">
          <h1
            className="text-lg font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            CompanyGPT Chat
          </h1>
          <span
            className="text-xs px-2 py-1 rounded"
            style={{
              background: "var(--tint-gray-50)",
              color: "var(--text-muted)",
            }}
          >
            PREVIEW
          </span>
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => setView("chat")}
            className="px-3 py-1 text-sm font-medium rounded transition-all"
            style={{
              background:
                view === "chat" ? "rgba(14, 165, 233, 0.1)" : "transparent",
              color:
                view === "chat" ? "var(--blue-600)" : "var(--text-secondary)",
              border:
                view === "chat"
                  ? "1px solid rgba(14, 165, 233, 0.2)"
                  : "1px solid transparent",
            }}
          >
            Chat
          </button>
          <button
            onClick={() => setView("settings")}
            className="px-3 py-1 text-sm font-medium rounded transition-all"
            style={{
              background:
                view === "settings" ? "rgba(14, 165, 233, 0.1)" : "transparent",
              color:
                view === "settings"
                  ? "var(--blue-600)"
                  : "var(--text-secondary)",
              border:
                view === "settings"
                  ? "1px solid rgba(14, 165, 233, 0.2)"
                  : "1px solid transparent",
            }}
          >
            Settings
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {view === "chat" ? (
          <ChatContainer />
        ) : (
          <div className="p-6" style={{ color: "var(--text-primary)" }}>
            <h2 className="text-xl font-semibold mb-4">Settings</h2>
            <p style={{ color: "var(--text-muted)" }}>
              Settings coming soon...
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default Panel;
