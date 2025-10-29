// src/panel/hooks/useAuth.ts
// Enhanced authentication hook with 401 error handling and validation

import { useState, useCallback, useEffect } from "react";
import { checkAuth, getDomain } from "../services/api";
import { setStorage } from "../services/chrome";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  domain: string | null;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    domain: null,
    error: null,
  });

  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [authCheckCount, setAuthCheckCount] = useState(0);

  /**
   * Check authentication status
   */
  const checkAuthentication = useCallback(async (forceRefresh = false) => {
    console.log("[useAuth] Checking authentication...", { forceRefresh });
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const authResult = await checkAuth();
      const domain = authResult.domain || (await getDomain());

      console.log("[useAuth] Auth result:", authResult);

      const isAuth = authResult.isAuthenticated;

      setAuthState({
        isAuthenticated: isAuth,
        isLoading: false,
        domain,
        error: null,
      });

      // Show login overlay if not authenticated
      setShowLoginOverlay(!isAuth);

      return isAuth;
    } catch (error) {
      console.error("[useAuth] Auth check failed:", error);
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        domain: null,
        error: (error as Error).message,
      });
      setShowLoginOverlay(true);
      return false;
    }
  }, []);

  /**
   * Force show login overlay (called on 401 errors)
   */
  const forceShowLogin = useCallback((reason?: string) => {
    console.log("[useAuth] Forcing login overlay:", reason);

    setAuthState((prev) => ({
      ...prev,
      isAuthenticated: false,
      error: reason || "Sitzung abgelaufen. Bitte erneut anmelden.",
    }));

    setShowLoginOverlay(true);
  }, []);

  /**
   * Open login page in new tab
   */
  const openLoginPage = useCallback(
    async (customDomain?: string) => {
      console.log("[useAuth] Opening login page...");

      try {
        // Determine which domain to use
        let loginDomain = customDomain || authState.domain;

        // If no domain, prompt user
        if (!loginDomain) {
          const userInput = prompt(
            'Bitte gib deine Firmen-Subdomain ein (z.B. "firma" für firma.506.ai):'
          );

          if (!userInput) {
            console.log("[useAuth] Login cancelled by user");
            return;
          }

          // Validate domain format
          const cleanDomain = userInput.trim().toLowerCase();
          if (!/^[a-z0-9-]+$/.test(cleanDomain)) {
            alert(
              "Ungültige Subdomain. Bitte nur Kleinbuchstaben, Zahlen und Bindestriche verwenden."
            );
            return;
          }

          loginDomain = cleanDomain;
        }

        // Save domain to storage
        await setStorage("lastKnownDomain", loginDomain);

        // Update local state
        setAuthState((prev) => ({
          ...prev,
          domain: loginDomain,
        }));

        // Build login URL
        const loginUrl = `https://${loginDomain}.506.ai/de/login?callbackUrl=%2F`;
        console.log("[useAuth] Opening URL:", loginUrl);

        // Open in new tab
        await chrome.tabs.create({ url: loginUrl });

        console.log("[useAuth] Login page opened successfully");
      } catch (error) {
        console.error("[useAuth] Failed to open login page:", error);
        setAuthState((prev) => ({
          ...prev,
          error: "Fehler beim Öffnen der Anmeldeseite",
        }));
      }
    },
    [authState.domain]
  );

  /**
   * Recheck authentication after user logs in
   */
  const recheckAuth = useCallback(async () => {
    console.log("[useAuth] Rechecking authentication...");

    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    // Wait for cookies to be set
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Force refresh auth check
    const isAuthenticated = await checkAuthentication(true);

    if (isAuthenticated) {
      console.log("[useAuth] Login successful!");
      setShowLoginOverlay(false);

      // Increment check count to trigger re-initialization
      setAuthCheckCount((prev) => prev + 1);
    } else {
      console.log("[useAuth] Still not authenticated");
      setAuthState((prev) => ({
        ...prev,
        error: "Bitte melde dich erst im Browser-Tab an",
        isLoading: false,
      }));
    }

    return isAuthenticated;
  }, [checkAuthentication]);

  /**
   * Manual domain input handler
   */
  const setManualDomain = useCallback((domain: string) => {
    setAuthState((prev) => ({
      ...prev,
      domain: domain.trim().toLowerCase(),
    }));
  }, []);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setAuthState((prev) => ({
      ...prev,
      error: null,
    }));
  }, []);

  // Check auth on mount
  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);

  // Listen for 401 errors globally (via chrome runtime messages)
  useEffect(() => {
    const handle401Error = (message: { action: string; error?: string }) => {
      if (message.action === "AUTH_ERROR_401") {
        console.log("[useAuth] Received 401 error notification");
        forceShowLogin("Sitzung abgelaufen. Bitte erneut anmelden.");
      }
    };

    chrome.runtime.onMessage.addListener(handle401Error);

    return () => {
      chrome.runtime.onMessage.removeListener(handle401Error);
    };
  }, [forceShowLogin]);

  return {
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    domain: authState.domain,
    error: authState.error,
    showLoginOverlay,
    authCheckCount, // Used to trigger re-initialization after login
    openLoginPage,
    recheckAuth,
    setManualDomain,
    clearError,
    forceShowLogin, // Export for manual 401 handling
  };
}
