// src/panel/components/auth/LoginOverlay.tsx
// Full-screen login overlay with blur effect

import { useState, type KeyboardEvent } from "react";

interface LoginOverlayProps {
  isVisible: boolean;
  detectedDomain: string | null;
  onLogin: (domain?: string) => void;
  onCheckAuth: () => Promise<boolean>;
  error?: string | null;
}

function LoginOverlay({
  isVisible,
  detectedDomain,
  onLogin,
  onCheckAuth,
  error,
}: LoginOverlayProps) {
  const [manualDomain, setManualDomain] = useState("");
  const [showCheckButton, setShowCheckButton] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  if (!isVisible) return null;

  /**
   * Handle login button click
   */
  const handleLogin = () => {
    const finalDomain = detectedDomain || manualDomain.trim();

    if (!finalDomain) {
      alert("Bitte Subdomain eingeben");
      return;
    }

    // Validate domain format
    if (!/^[a-z0-9-]+$/.test(finalDomain)) {
      alert(
        "Ungültige Subdomain. Bitte nur Kleinbuchstaben, Zahlen und Bindestriche verwenden."
      );
      return;
    }

    // Open login page
    onLogin(finalDomain);

    // Show check button
    setShowCheckButton(true);
  };

  /**
   * Handle check auth button click
   */
  const handleCheckAuth = async () => {
    setIsChecking(true);
    const success = await onCheckAuth();
    setIsChecking(false);

    if (!success) {
      // Keep check button visible if auth failed
      setShowCheckButton(true);
    }
  };

  /**
   * Handle Enter key in domain input
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-card">
        {/* CompanyGPT Logo/Icon */}
        <div className="login-icon">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
          </svg>
        </div>

        {/* Heading */}
        <h2>Anmeldung erforderlich</h2>
        <p>Bitte melde dich bei CompanyGPT an, um den Chat zu nutzen.</p>

        {/* Domain Detection Status (shown when domain is auto-detected) */}
        {detectedDomain ? (
          <div className="domain-status">
            <small>
              Domain erkannt:{" "}
              <span id="detected-domain">{detectedDomain}.506.ai</span>
            </small>
          </div>
        ) : (
          /* Manual Domain Input (shown when NO domain detected) */
          <div className="domain-input-group">
            <label htmlFor="domain-input">Firmen-Subdomain eingeben:</label>
            <div className="input-with-suffix">
              <input
                type="text"
                id="domain-input"
                placeholder="firma"
                pattern="[a-z0-9\-]+"
                value={manualDomain}
                onChange={(e) => setManualDomain(e.target.value.toLowerCase())}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              <span className="suffix">.506.ai</span>
            </div>
            <small className="help-text">z.B. "firma" für firma.506.ai</small>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="login-error">
            <small>{error}</small>
          </div>
        )}

        {/* Login Button (primary action) */}
        {!showCheckButton ? (
          <button className="btn-login" onClick={handleLogin}>
            Bei CompanyGPT anmelden
          </button>
        ) : (
          <>
            {/* Check Auth Button (shown AFTER login attempt) */}
            <button
              className="btn-check-auth"
              onClick={handleCheckAuth}
              disabled={isChecking}
            >
              {isChecking ? "Prüfe..." : "Anmeldung prüfen"}
            </button>

            {/* Login Hint (shown after login button clicked) */}
            <div className="login-hint">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <circle cx="12" cy="12" r="10" opacity="0.3" />
                <path d="M12 7v5l3 3" />
              </svg>
              <span>Anmeldung läuft im neuen Tab...</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default LoginOverlay;
