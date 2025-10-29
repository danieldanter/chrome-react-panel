import { useEffect } from "react";
import type { RefObject, MutableRefObject } from "react";

type AnyTextAreaRef =
  | RefObject<HTMLTextAreaElement>
  | MutableRefObject<HTMLTextAreaElement | null>;

export function useAutoResize(
  textareaRef: AnyTextAreaRef,
  maxHeight: number = 100
): void {
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const resize = () => {
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
    };

    textarea.addEventListener("input", resize);
    resize();
    return () => textarea.removeEventListener("input", resize);
  }, [textareaRef, maxHeight]);
}
