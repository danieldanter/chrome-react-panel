// src/panel/Panel.tsx
// Main panel component with header and view switching

import { useCallback } from "react";
import { useUI } from "./hooks/useUI";
import { useChat } from "./hooks/useChat";
import Header from "./components/common/Header";
import ChatContainer from "./components/chat/ChatContainer";
import SettingsView from "./components/settings/SettingsView";

function Panel() {
  const { activeView, switchView } = useUI();
  const { clearMessages, model } = useChat();

  /**
   * Handle clear chat button
   */
  const handleClearChat = useCallback(() => {
    if (
      window.confirm(
        "Möchten Sie den Chat wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
      )
    ) {
      clearMessages();
      console.log("[Panel] Chat cleared");
    }
  }, [clearMessages]);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-primary)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Header
        activeView={activeView}
        onViewChange={switchView}
        onClearChat={handleClearChat}
        modelName={model.name}
      />

      {/* Main Content - Conditional View Rendering */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {activeView === "chat" && <ChatContainer />}
        {activeView === "settings" && <SettingsView />}
      </div>
    </div>
  );
}

export default Panel;
