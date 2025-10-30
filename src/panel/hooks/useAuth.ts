// src/panel/hooks/useAuth.ts
// ✅ INSTANT LOGIN DETECTION: Hides login overlay immediately, shows loading state

import { useState, useCallback, useEffect, useRef } from "react";
import { checkAuth, getDomain } from "../services/api";
import { setStorage } from "../services/chrome";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean; // ✅ NEW: Separate state for post-login initialization
  domain: string | null;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    isInitializing: false, // ✅ NEW
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
        const authResult = await checkAuth();
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
            isInitializing: true, // ✅ NEW: Show "Loading chat..." instead of login
            domain,
            error: null,
          });

          // ✅ After a brief moment, clear initializing flag
          // (ChatContainer's initialize() will complete in background)
          setTimeout(() => {
            setAuthState((prev) => ({ ...prev, isInitializing: false }));
          }, 1500); // Show "Loading chat..." for 1.5s max
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
   * ✅ INSTANT: Cookie monitoring with 50ms delay (ultra-fast!)
   */
  useEffect(() => {
    if (!showLoginOverlay) {
      return;
    }

    console.log("[useAuth] 🍪 Starting cookie monitoring");

    const handleCookieChange = (
      changeInfo: chrome.cookies.CookieChangeInfo
    ) => {
      if (
        changeInfo.cookie.name === "__Secure-next-auth.session-token" &&
        changeInfo.cookie.domain.includes("506.ai") &&
        !changeInfo.removed
      ) {
        console.log("[useAuth] ⚡ Cookie detected! Verifying auth...");

        // ✅ INSTANT: Only 50ms delay for ultra-fast response
        setTimeout(async () => {
          const isAuth = await checkAuthentication(true, true);

          if (isAuth) {
            console.log("[useAuth] 🎉 Login confirmed via cookie!");
            setAuthCheckCount((prev) => prev + 1);
          }
        }, 50); // ← 50ms for instant feedback!
      }
    };

    chrome.cookies.onChanged.addListener(handleCookieChange);

    return () => {
      console.log("[useAuth] ⏹️ Stopped cookie monitoring");
      chrome.cookies.onChanged.removeListener(handleCookieChange);
    };
  }, [showLoginOverlay, checkAuthentication]);

  /**
   * ✅ Fast polling every 1 second as backup
   */
  useEffect(() => {
    if (!showLoginOverlay) {
      return;
    }

    console.log("[useAuth] ⚡ Starting polling (1s intervals)");

    const checkNow = async () => {
      const isAuth = await checkAuthentication(true, true);

      if (isAuth) {
        console.log("[useAuth] 🎉 Login detected via polling!");
        setAuthCheckCount((prev) => prev + 1);
        return true;
      }
      return false;
    };

    // Check immediately
    checkNow();

    // Then poll every 1 second
    const intervalId = setInterval(async () => {
      console.log("[useAuth] 🔍 Polling...");

      const shouldStop = await checkNow();
      if (shouldStop) {
        clearInterval(intervalId);
      }
    }, 1000);

    return () => {
      console.log("[useAuth] ⏹️ Stopped polling");
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
    isInitializing: authState.isInitializing, // ✅ NEW: Expose initializing state
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
