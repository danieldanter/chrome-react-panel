// src/panel/components/auth/LoginOverlay.tsx
// ✅ IMPROVED: Simplified - no manual "check auth" button needed!
// Login is detected automatically via cookie monitoring

import { useState, type KeyboardEvent } from "react";

interface LoginOverlayProps {
  isVisible: boolean;
  detectedDomain: string | null;
  onLogin: (domain?: string) => void;
  error?: string | null;
}

function LoginOverlay({
  isVisible,
  detectedDomain,
  onLogin,
  error,
}: LoginOverlayProps) {
  const [manualDomain, setManualDomain] = useState("");

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

    // Open login page (auto-detection will handle the rest!)
    onLogin(finalDomain);
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

        {/* Login Button (single button - auto-detection handles the rest!) */}
        <button className="btn-login" onClick={handleLogin}>
          Bei CompanyGPT anmelden
        </button>

        {/* ✅ NEW: Auto-detection hint */}
        <div className="login-hint" style={{ marginTop: "16px" }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ marginRight: "8px" }}
          >
            <circle cx="12" cy="12" r="10" opacity="0.3" />
            <path d="M12 7v5l3 3" />
          </svg>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Nach der Anmeldung wird der Chat automatisch aktiviert
          </span>
        </div>
      </div>
    </div>
  );
}

export default LoginOverlay;
