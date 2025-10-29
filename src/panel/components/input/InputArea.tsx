// src/panel/components/input/InputArea.tsx
// Input area wrapper containing context bar and message input

import ContextBar from "./ContextBar";
import MessageInput from "./MessageInput";
import type { ContextState } from "../../types/context";

interface InputAreaProps {
  context: ContextState;
  onClearContext: () => void;
  onLoadContext: () => void;
  onSend: (message: string) => void;
  disabled?: boolean;
}

function InputArea({
  context,
  onClearContext,
  onLoadContext,
  onSend,
  disabled = false,
}: InputAreaProps) {
  return (
    <footer
      style={{
        padding: "12px",
        borderTop: "1px solid var(--border)",
        background: "var(--bg-primary)",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {/* Context Bar (appears when context is loaded) */}
      {context.isLoaded && (
        <ContextBar context={context} onClear={onClearContext} />
      )}

      {/* Message Input */}
      <MessageInput
        onSend={onSend}
        disabled={disabled}
        onLoadContext={onLoadContext}
        contextLoading={context.isLoading}
        contextLoaded={context.isLoaded}
      />
    </footer>
  );
}

export default InputArea;
