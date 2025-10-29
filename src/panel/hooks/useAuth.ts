// src/panel/hooks/useAuth.ts
// ✅ OPTIMIZED: Ultra-fast login detection (0.5-1s) with no flickering

import { useState, useCallback, useEffect, useRef } from "react";
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

      // ✅ Lighter debouncing: 500ms instead of 1000ms
      const now = Date.now();
      if (!skipDebounce && now - lastAuthCheck.current < 500) {
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

    const isAuthenticated = await checkAuthentication(false, true); // Not silent, skip debounce

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
    checkAuthentication(false, true); // Not silent, skip debounce
  }, [checkAuthentication]);

  /**
   * ✅ OPTIMIZED: Ultra-fast cookie monitoring with multiple listeners
   */
  useEffect(() => {
    if (!showLoginOverlay) {
      return;
    }

    console.log("[useAuth] 🍪 Starting FAST cookie monitoring");

    const handleCookieChange = (
      changeInfo: chrome.cookies.CookieChangeInfo
    ) => {
      if (
        changeInfo.cookie.name === "__Secure-next-auth.session-token" &&
        changeInfo.cookie.domain.includes("506.ai") &&
        !changeInfo.removed
      ) {
        console.log("[useAuth] ⚡ Cookie detected INSTANTLY! Checking auth...");

        // ✅ ULTRA FAST: Only 100ms delay (was 500ms)
        setTimeout(async () => {
          const isAuth = await checkAuthentication(true, true); // Silent, skip debounce

          if (isAuth) {
            console.log("[useAuth] 🎉 Login confirmed!");
            setShowLoginOverlay(false);
            setAuthCheckCount((prev) => prev + 1);
          }
        }, 100); // ← 100ms instead of 500ms!
      }
    };

    chrome.cookies.onChanged.addListener(handleCookieChange);

    return () => {
      console.log("[useAuth] ⏹️ Stopped cookie monitoring");
      chrome.cookies.onChanged.removeListener(handleCookieChange);
    };
  }, [showLoginOverlay, checkAuthentication]);

  /**
   * ✅ OPTIMIZED: Fast polling every 1 second (not 3)
   */
  useEffect(() => {
    if (!showLoginOverlay) {
      return;
    }

    console.log("[useAuth] ⚡ Starting FAST polling (every 1s)");

    // ✅ First check immediately (don't wait 1 second)
    const checkNow = async () => {
      const isAuth = await checkAuthentication(true, true); // Silent, skip debounce

      if (isAuth) {
        console.log("[useAuth] 🎉 Login detected!");
        setShowLoginOverlay(false);
        setAuthCheckCount((prev) => prev + 1);
        return true; // Stop polling
      }
      return false;
    };

    // Check immediately
    checkNow();

    // Then poll every 1 second
    const intervalId = setInterval(async () => {
      console.log("[useAuth] 🔍 Fast polling...");

      const shouldStop = await checkNow();
      if (shouldStop) {
        clearInterval(intervalId);
      }
    }, 1000); // ← 1 second instead of 3!

    return () => {
      console.log("[useAuth] ⏹️ Stopped fast polling");
      clearInterval(intervalId);
    };
  }, [showLoginOverlay, checkAuthentication]);

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

  return {
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
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
