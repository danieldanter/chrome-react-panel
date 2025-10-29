// src/panel/components/chat/StreamingMessage.tsx
// Streaming message that displays text character-by-character

import { useState, useEffect } from "react";
import { useMarkdownRenderer } from "../../hooks/useMarkdownRenderer";

interface StreamingMessageProps {
  content: string;
  speed?: number; // milliseconds per character
  onComplete?: () => void;
}

function StreamingMessage({
  content,
  speed = 3,
  onComplete,
}: StreamingMessageProps) {
  const { renderMarkdown } = useMarkdownRenderer();
  const [displayedText, setDisplayedText] = useState("");
  const [isStreaming, setIsStreaming] = useState(true);

  useEffect(() => {
    let currentIndex = 0;

    // Clean up content
    let processedContent = content;
    if (processedContent.startsWith('"') && processedContent.endsWith('"')) {
      processedContent = processedContent.slice(1, -1);
    }

    // Fix escape sequences
    processedContent = processedContent.replace(/\\n\\n\\n\\n/g, "\n\n");
    processedContent = processedContent.replace(/\\n\\n\\n/g, "\n\n");
    processedContent = processedContent.replace(/\\n\\n/g, "\n\n");
    processedContent = processedContent.replace(/\\n/g, "\n");

    // Get plain text version for streaming
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = renderMarkdown(processedContent);
    const plainText = tempDiv.textContent || tempDiv.innerText || "";

    const interval = setInterval(() => {
      if (currentIndex < plainText.length) {
        setDisplayedText(plainText.slice(0, currentIndex + 1));
        currentIndex++;

        // Trigger scroll every 10 characters (like vanilla version)
        if (currentIndex % 10 === 0) {
          // Dispatch custom event to trigger scroll in parent
          window.dispatchEvent(new CustomEvent("streaming-update"));
        }
      } else {
        clearInterval(interval);
        setIsStreaming(false);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [content, speed, onComplete, renderMarkdown]);

  return (
    <div
      className="message assistant"
      style={{
        maxWidth: "85%",
        padding: "12px 14px",
        borderRadius: "var(--r-2xl)",
        fontSize: "14px",
        lineHeight: "1.5",
        wordWrap: "break-word",
        animation: "fadeIn 0.3s ease",
        alignSelf: "flex-start",
        background: "var(--tint-gray-100)",
        border: "1px solid var(--border)",
        color: "var(--text-primary)",
      }}
    >
      {isStreaming ? (
        // Show plain text with cursor while streaming
        <>
          {displayedText.split("\n").map((line, i, arr) => (
            <span key={i}>
              {line}
              {i < arr.length - 1 && <br />}
            </span>
          ))}
          <span className="streaming-cursor">▊</span>
        </>
      ) : (
        // Show formatted markdown when complete
        <div
          dangerouslySetInnerHTML={{
            __html: renderMarkdown(content),
          }}
        />
      )}
    </div>
  );
}

export default StreamingMessage;
