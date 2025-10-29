// src/panel/hooks/useMarkdownRenderer.ts
// Custom markdown renderer hook - NO external library
// Based on the vanilla JavaScript version

import { useCallback } from "react";

export function useMarkdownRenderer() {
  /**
   * Escape HTML to prevent XSS
   */
  const escapeHtml = useCallback((text: string): string => {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }, []);

  /**
   * Render markdown to HTML
   */
  const renderMarkdown = useCallback(
    (text: string): string => {
      if (!text) return "";

      let html = text;

      // Remove surrounding quotes
      if (html.startsWith('"') && html.endsWith('"')) {
        html = html.slice(1, -1);
      }

      // Fix literal escape sequences
      html = html.replace(/\\n\\n\\n\\n/g, "\n\n");
      html = html.replace(/\\n\\n\\n/g, "\n\n");
      html = html.replace(/\\n\\n/g, "\n\n");
      html = html.replace(/\\n/g, "\n");

      // Fix escaped characters
      html = html.replace(/\\"/g, '"');
      html = html.replace(/\\\\/g, "\\");

      // ===== STEP 1: Handle code blocks FIRST =====
      const codeBlocks: string[] = [];
      html = html.replace(
        /```(\w+)?\n?([\s\S]*?)```/g,
        (_match, language, code) => {
          const index = codeBlocks.length;
          const lang = language || "text";
          codeBlocks.push(
            `<pre class="code-block"><code class="language-${lang}">${escapeHtml(
              code.trim()
            )}</code></pre>`
          );
          return `__CODE_BLOCK_${index}__`;
        }
      );

      // ===== STEP 2: Handle inline code SECOND =====
      const inlineCodes: string[] = [];
      html = html.replace(/`([^`]+)`/g, (_match, code) => {
        const index = inlineCodes.length;
        inlineCodes.push(
          `<code class="inline-code">${escapeHtml(code)}</code>`
        );
        return `__INLINE_CODE_${index}__`;
      });

      // ===== STEP 3: Escape remaining HTML =====
      html = escapeHtml(html);

      // ===== STEP 4: Headers (before bold to avoid conflicts) =====
      html = html.replace(/^### (.*$)/gm, '<h3 class="markdown-h3">$1</h3>');
      html = html.replace(/^## (.*$)/gm, '<h2 class="markdown-h2">$1</h2>');
      html = html.replace(/^# (.*$)/gm, '<h1 class="markdown-h1">$1</h1>');

      // ===== STEP 5: Bold and Italic =====
      html = html.replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>"); // ***text***
      html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"); // **text**
      html = html.replace(/\*(.*?)\*/g, "<em>$1</em>"); // *text*

      // ===== STEP 6: Links =====
      html = html.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener">$1</a>'
      );

      // ===== STEP 7: Lists =====
      // Unordered lists (-, *, +)
      html = html.replace(/^[-*+] (.+)$/gm, '<li class="markdown-li">$1</li>');
      // Numbered lists
      html = html.replace(
        /^\d+\. (.+)$/gm,
        '<li class="markdown-li numbered">$1</li>'
      );

      // Wrap consecutive list items in ul/ol
      html = html.replace(
        /(<li class="markdown-li"(?!.*numbered)>.*?<\/li>(?:\s*<li class="markdown-li"(?!.*numbered)>.*?<\/li>)*)/gm,
        '<ul class="markdown-ul">$1</ul>'
      );

      html = html.replace(
        /(<li class="markdown-li numbered">.*?<\/li>(?:\s*<li class="markdown-li numbered">.*?<\/li>)*)/gm,
        '<ol class="markdown-ol">$1</ol>'
      );

      // ===== STEP 8: Blockquotes =====
      html = html.replace(
        /^&gt; (.+)$/gm,
        '<blockquote class="markdown-quote">$1</blockquote>'
      );

      // ===== STEP 9: Horizontal rules =====
      html = html.replace(/^---$/gm, '<hr class="markdown-hr">');

      // ===== STEP 10: Strikethrough =====
      html = html.replace(/~~(.*?)~~/g, "<del>$1</del>");

      // ===== STEP 11: Task lists =====
      html = html.replace(
        /^- \[ ] (.+)$/gm,
        '<li class="task-item"><input type="checkbox" disabled> $1</li>'
      );
      html = html.replace(
        /^- \[x] (.+)$/gm,
        '<li class="task-item"><input type="checkbox" disabled checked> $1</li>'
      );

      // ===== STEP 12: Highlight/mark =====
      html = html.replace(/==(.*?)==/g, "<mark>$1</mark>");

      // ===== STEP 13: Paragraphs =====
      html = html.replace(/\n\s*\n/g, '</p><p class="markdown-p">');
      html = `<p class="markdown-p">${html}</p>`;

      // Clean up empty paragraphs
      html = html.replace(/<p class="markdown-p">\s*<\/p>/g, "");
      html = html.replace(/<p class="markdown-p">(\s*<[^>]+>\s*)<\/p>/g, "$1");

      // ===== STEP 14: Line breaks =====
      html = html.replace(/\n/g, "<br>");

      // ===== STEP 15: Restore code blocks and inline code =====
      codeBlocks.forEach((codeBlock, index) => {
        html = html.replace(`__CODE_BLOCK_${index}__`, codeBlock);
      });

      inlineCodes.forEach((inlineCode, index) => {
        html = html.replace(`__INLINE_CODE_${index}__`, inlineCode);
      });

      return html;
    },
    [escapeHtml]
  );

  return { renderMarkdown };
}
