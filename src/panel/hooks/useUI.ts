// src/panel/hooks/useUI.ts
// Hook for UI state management (view switching)

import { useState, useCallback } from "react";

export type View = "chat" | "settings";

export function useUI() {
  const [activeView, setActiveView] = useState<View>("chat");

  /**
   * Switch to a specific view
   */
  const switchView = useCallback((view: View) => {
    console.log("[useUI] Switching to view:", view);
    setActiveView(view);
  }, []);

  /**
   * Check if a view is active
   */
  const isViewActive = useCallback(
    (view: View) => activeView === view,
    [activeView]
  );

  return {
    activeView,
    switchView,
    isViewActive,
  };
}
