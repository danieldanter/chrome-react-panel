// src/panel/components/settings/SettingsView.tsx
// Settings view placeholder

function SettingsView() {
  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "16px",
        background: "var(--white)",
      }}
    >
      <h3
        style={{
          marginBottom: "16px",
          fontSize: "16px",
          fontWeight: 600,
          color: "var(--text-primary)",
        }}
      >
        Einstellungen
      </h3>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 0",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ fontSize: "14px", color: "var(--text-primary)" }}>
          Seitenkontext
        </div>
        <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
          Aktiviert
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 0",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ fontSize: "14px", color: "var(--text-primary)" }}>
          Version
        </div>
        <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
          1.0.0
        </div>
      </div>

      <p
        style={{
          marginTop: "24px",
          fontSize: "13px",
          color: "var(--text-muted)",
        }}
      >
        Weitere Einstellungen folgen bald...
      </p>
    </div>
  );
}

export default SettingsView;
