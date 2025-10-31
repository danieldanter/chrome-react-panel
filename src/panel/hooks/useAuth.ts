// src/panel/hooks/useAuth.ts
// ✅ OPTIMIZED: Message-based auth detection (NO POLLING!)
// Uses the same approach as the old vanilla JS version

import { useState, useCallback, useEffect, useRef } from "react";
import { checkAuth, getDomain } from "../services/api";
import { setStorage } from "../services/chrome";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  domain: string | null;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    isInitializing: false,
    domain: null,
    error: null,
  });

  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [authCheckCount, setAuthCheckCount] = useState(0);

  // Prevent concurrent checks
  const authCheckInProgress = useRef(false);
  const lastAuthCheck = useRef(0);

  /**
   * Check authentication status
   * @param silent - If true, don't update loading state
   * @param skipDebounce - If true, skip debouncing (for urgent checks)
   */
  const checkAuthentication = useCallback(
    async (silent = false, skipDebounce = false) => {
      // Prevent concurrent checks
      if (authCheckInProgress.current) {
        return authState.isAuthenticated;
      }

      // ✅ Lighter debouncing: 300ms
      const now = Date.now();
      if (!skipDebounce && now - lastAuthCheck.current < 300) {
        return authState.isAuthenticated;
      }

      authCheckInProgress.current = true;
      lastAuthCheck.current = now;

      console.log("[useAuth] Checking authentication...", {
        silent,
        skipDebounce,
      });

      if (!silent) {
        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
      }

      try {
        // ✅ FIXED: Pass skipCache when skipDebounce is true
        const authResult = await checkAuth(skipDebounce);
        const domain = authResult.domain || (await getDomain());

        console.log("[useAuth] Auth result:", authResult);

        const isAuth = authResult.isAuthenticated;

        // ✅ If authentication detected, immediately hide login overlay
        if (isAuth) {
          console.log("[useAuth] 🎉 Authentication detected!");
          setShowLoginOverlay(false);

          // ✅ Show initializing state briefly
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            isInitializing: true,
            domain,
            error: null,
          });

          // ✅ After a brief moment, clear initializing flag
          setTimeout(() => {
            setAuthState((prev) => ({ ...prev, isInitializing: false }));
          }, 1500);
        } else {
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            isInitializing: false,
            domain,
            error: null,
          });
          setShowLoginOverlay(true);
        }

        return isAuth;
      } catch (error) {
        console.error("[useAuth] Auth check failed:", error);
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          isInitializing: false,
          domain: null,
          error: (error as Error).message,
        });
        setShowLoginOverlay(true);
        return false;
      } finally {
        authCheckInProgress.current = false;
      }
    },
    [authState.isAuthenticated]
  );

  /**
   * Force show login overlay
   */
  const forceShowLogin = useCallback((reason?: string) => {
    console.log("[useAuth] Forcing login overlay:", reason);

    setAuthState((prev) => ({
      ...prev,
      isAuthenticated: false,
      isInitializing: false,
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
        let loginDomain = customDomain || authState.domain;

        if (!loginDomain) {
          const userInput = prompt(
            'Bitte gib deine Firmen-Subdomain ein (z.B. "firma" für firma.506.ai):'
          );

          if (!userInput) {
            console.log("[useAuth] Login cancelled by user");
            return;
          }

          const cleanDomain = userInput.trim().toLowerCase();
          if (!/^[a-z0-9-]+$/.test(cleanDomain)) {
            alert(
              "Ungültige Subdomain. Bitte nur Kleinbuchstaben, Zahlen und Bindestriche verwenden."
            );
            return;
          }

          loginDomain = cleanDomain;
        }

        await setStorage("lastKnownDomain", loginDomain);

        const loginUrl = `https://${loginDomain}.506.ai/sign-in`;
        console.log("[useAuth] Opening:", loginUrl);

        await chrome.tabs.create({ url: loginUrl });

        console.log("[useAuth] Login page opened successfully");
      } catch (error) {
        console.error("[useAuth] Failed to open login page:", error);
        setAuthState((prev) => ({
          ...prev,
          error: "Konnte Anmeldeseite nicht öffnen",
        }));
      }
    },
    [authState.domain]
  );

  /**
   * Recheck authentication
   */
  const recheckAuth = useCallback(async (): Promise<boolean> => {
    console.log("[useAuth] Rechecking authentication...");

    const isAuthenticated = await checkAuthentication(false, true);

    if (isAuthenticated) {
      setShowLoginOverlay(false);
      setAuthCheckCount((prev) => prev + 1);
      console.log("[useAuth] ✅ Authentication successful!");
    } else {
      console.log("[useAuth] ❌ Still not authenticated");
    }

    return isAuthenticated;
  }, [checkAuthentication]);

  /**
   * Set manual domain
   */
  const setManualDomain = useCallback(async (domain: string) => {
    console.log("[useAuth] Setting manual domain:", domain);
    await setStorage("lastKnownDomain", domain);
    setAuthState((prev) => ({ ...prev, domain }));
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setAuthState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * ✅ Initial check
   */
  useEffect(() => {
    console.log("[useAuth] Component mounted - checking initial auth");
    checkAuthentication(false, true);
  }, [checkAuthentication]);

  /**
   * ✅✅ OPTIMIZED: ALWAYS-ON Cookie monitoring + MESSAGE-BASED detection
   * This runs ALL THE TIME and detects BOTH login AND logout
   * NO POLLING NEEDED - background worker sends messages!
   */
  useEffect(() => {
    console.log("[useAuth] 🍪 Starting cookie monitoring (always-on)");

    const handleCookieChange = (
      changeInfo: chrome.cookies.CookieChangeInfo
    ) => {
      // Check if it's our auth cookie
      if (
        changeInfo.cookie.name === "__Secure-next-auth.session-token" &&
        changeInfo.cookie.domain.includes("506.ai")
      ) {
        // ✅ LOGOUT DETECTION: Cookie removed
        if (changeInfo.removed) {
          console.log("[useAuth] 🚪 Cookie removed! User logged out!");

          // Force show login immediately
          forceShowLogin("Abgemeldet. Bitte erneut anmelden.");

          return;
        }

        // ✅ LOGIN DETECTION: Cookie added/changed
        console.log("[useAuth] ⚡ Cookie detected! Verifying auth...");

        // ✅ INSTANT: Only 50ms delay for ultra-fast response
        setTimeout(async () => {
          const isAuth = await checkAuthentication(true, true);

          if (isAuth) {
            console.log("[useAuth] 🎉 Login confirmed via cookie!");
            setAuthCheckCount((prev) => prev + 1);
          }
        }, 50);
      }
    };

    chrome.cookies.onChanged.addListener(handleCookieChange);

    return () => {
      console.log("[useAuth] ⏹️ Stopped cookie monitoring");
      chrome.cookies.onChanged.removeListener(handleCookieChange);
    };
  }, [checkAuthentication, forceShowLogin]);

  /**
   * ✅✅ NEW: Listen for AUTH_STATE_CHANGED messages from background
   * This is the EFFICIENT way - no polling needed!
   * Background worker sends message when cookie changes
   */
  useEffect(() => {
    console.log(
      "[useAuth] 📨 Setting up message listener for background notifications"
    );

    const handleBackgroundMessage = (message: {
      type?: string;
      action?: string;
      domain?: string;
    }) => {
      const messageType = message.type || message.action;

      // ✅ AUTH_STATE_CHANGED from background worker
      if (messageType === "AUTH_STATE_CHANGED") {
        console.log("[useAuth] 📬 Received AUTH_STATE_CHANGED from background");
        console.log("[useAuth] 🔄 Rechecking auth (message-driven)");

        // Recheck auth immediately (skipCache = true)
        checkAuthentication(true, true);
      }
    };

    chrome.runtime.onMessage.addListener(handleBackgroundMessage);

    return () => {
      console.log("[useAuth] 📪 Removed message listener");
      chrome.runtime.onMessage.removeListener(handleBackgroundMessage);
    };
  }, [checkAuthentication]);

  /**
   * ✅ Listen for 401 errors
   */
  useEffect(() => {
    const handle401Error = (message: { action: string }) => {
      if (message.action === "AUTH_ERROR_401") {
        console.log("[useAuth] ⚠️ Received 401 error notification");
        forceShowLogin("Sitzung abgelaufen. Bitte erneut anmelden.");
      }
    };

    chrome.runtime.onMessage.addListener(handle401Error);

    return () => {
      chrome.runtime.onMessage.removeListener(handle401Error);
    };
  }, [forceShowLogin]);

  /**
   * ❌ REMOVED: Polling is NO LONGER NEEDED!
   * We use message-based communication instead (like the old vanilla JS version)
   * This saves performance and battery life
   */

  return {
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    isInitializing: authState.isInitializing,
    domain: authState.domain,
    error: authState.error,
    showLoginOverlay,
    authCheckCount,
    openLoginPage,
    recheckAuth,
    setManualDomain,
    clearError,
    forceShowLogin,
  };
}
