// src/panel/hooks/useAutoResize.ts
// ✅ FIXED: Properly recalculates height on mount and when dependencies change

import { useEffect, useLayoutEffect } from "react";
import type { RefObject, MutableRefObject } from "react";

type AnyTextAreaRef =
  | RefObject<HTMLTextAreaElement>
  | MutableRefObject<HTMLTextAreaElement | null>;

export function useAutoResize(
  textareaRef: AnyTextAreaRef,
  maxHeight: number = 100
): void {
  /**
   * ✅ FIXED: Use useLayoutEffect for initial resize to prevent visual jumps
   * This runs BEFORE the browser paints, so users never see wrong height
   */
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const resize = () => {
      // Reset height to auto to get accurate scrollHeight
      textarea.style.height = "auto";

      // Calculate new height (capped at maxHeight)
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);

      // Apply new height
      textarea.style.height = `${newHeight}px`;

      console.log("[useAutoResize] Resized:", {
        scrollHeight: textarea.scrollHeight,
        newHeight,
        maxHeight,
      });
    };

    // ✅ CRITICAL: Run resize immediately on mount
    resize();

    // Listen for input events
    textarea.addEventListener("input", resize);

    // ✅ NEW: Also listen for focus (helps with browser autofill)
    textarea.addEventListener("focus", resize);

    // Cleanup
    return () => {
      textarea.removeEventListener("input", resize);
      textarea.removeEventListener("focus", resize);
    };
  }, [textareaRef, maxHeight]);

  /**
   * ✅ NEW: Recalculate height when textarea becomes visible
   * This fixes the issue when component re-renders after authentication
   */
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Use ResizeObserver to detect when textarea becomes visible
    const resizeObserver = new ResizeObserver(() => {
      // Reset to correct height
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
    });

    resizeObserver.observe(textarea);

    return () => {
      resizeObserver.disconnect();
    };
  }, [textareaRef, maxHeight]);
}
