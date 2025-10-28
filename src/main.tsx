// src/panel/main.tsx
// Entry point without StrictMode to prevent double rendering

import ReactDOM from "react-dom/client";
import Panel from "./panel/Panel.tsx"; // ✅ Correct
import "../index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(<Panel />);
