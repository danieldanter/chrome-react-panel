// src/panel/Panel.tsx
// Main panel component with improved authentication handling

import { useCallback } from "react";
import { useUI } from "./hooks/useUI";
import { useChat } from "./hooks/useChat";
import { useAuth } from "./hooks/useAuth";
import Header from "./components/common/Header";
import ChatContainer from "./components/chat/ChatContainer";
import SettingsView from "./components/settings/SettingsView";
import LoginOverlay from "./components/auth/LoginOverlay";

function Panel() {
  const { activeView, switchView } = useUI();

  // Get auth state with forceShowLogin function
  const {
    isAuthenticated,
    isLoading,
    domain,
    error,
    showLoginOverlay,
    authCheckCount,
    openLoginPage,
    forceShowLogin,
  } = useAuth();

  // Pass forceShowLogin to useChat for 401 error handling
  const { clearMessages, model } = useChat(forceShowLogin);

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

  /**
   * Handle login button click
   */
  const handleLogin = useCallback(
    (customDomain?: string) => {
      openLoginPage(customDomain);
    },
    [openLoginPage]
  );

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-primary)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Login Overlay (shown when not authenticated) */}
      <LoginOverlay
        isVisible={showLoginOverlay && !isLoading}
        detectedDomain={domain}
        onLogin={handleLogin}
        error={error}
      />

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
        {/* Pass isAuthenticated and authCheckCount to ChatContainer */}
        {activeView === "chat" && (
          <ChatContainer
            isAuthenticated={isAuthenticated}
            authCheckCount={authCheckCount}
          />
        )}
        {activeView === "settings" && <SettingsView />}
      </div>

      {/* Loading Indicator (optional - shown while checking auth) */}
      {isLoading && !showLoginOverlay && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "var(--text-muted)",
            fontSize: "14px",
          }}
        >
          Überprüfe Anmeldung...
        </div>
      )}
    </div>
  );
}

export default Panel;
