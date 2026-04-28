function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function processInline(text: string): string {
  // Bold: **text**
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Italic: *text*  (but not inside **)
  text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
  // Underline: ++text++
  text = text.replace(/\+\+(.+?)\+\+/g, "<u>$1</u>");
  // Color: {color:#hex}text{/color}
  text = text.replace(
    /\{color:(#[0-9a-fA-F]{3,6})\}(.+?)\{\/color\}/g,
    '<span style="color:$1">$2</span>',
  );
  return text;
}

export function renderMarkdown(raw: string): string {
  const escaped = escapeHtml(raw);
  const lines = escaped.split("\n");
  let html = "";
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trimStart();
    if (trimmed.startsWith("### ")) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<h3>${processInline(trimmed.slice(4))}</h3>`;
    } else if (trimmed.startsWith("## ")) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<h2>${processInline(trimmed.slice(3))}</h2>`;
    } else if (trimmed.startsWith("- ")) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      html += `<li>${processInline(trimmed.slice(2))}</li>`;
    } else {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      if (trimmed === "") {
        html += "<br/>";
      } else {
        html += `<p>${processInline(line)}</p>`;
      }
    }
  }

  if (inList) html += "</ul>";
  return html;
}

/**
 * Sets innerHTML from pre-escaped markdown output.
 * Safe because renderMarkdown escapes all HTML before processing.
 */
export function setMarkdownHtml(el: HTMLElement, raw: string): void {
  el.innerHTML = renderMarkdown(raw);
}

/**
 * WhatsApp-style markdown renderer for chat messages.
 * Supports: *bold*, _italic_, ~strikethrough~, `code`, [text](url), and newlines.
 * HTML is escaped first — safe for dangerouslySetInnerHTML.
 */
export function renderChatMarkdown(raw: string): string {
  // 1. Escape HTML
  let text = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  // 2. Markdown links [text](url) — only allow http/https
  text = text.replace(
    /\[([^\]]{1,200})\]\((https?:\/\/[^)\s]{1,500})\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline hover:opacity-80">$1</a>',
  );

  // 3. Bold: *text*
  text = text.replace(/\*([^*\n]{1,500})\*/g, "<strong>$1</strong>");

  // 4. Italic: _text_
  text = text.replace(/_([^_\n]{1,500})_/g, "<em>$1</em>");

  // 5. Strikethrough: ~text~
  text = text.replace(/~([^~\n]{1,500})~/g, "<del>$1</del>");

  // 6. Inline code: `text`
  text = text.replace(
    /`([^`\n]{1,500})`/g,
    '<code class="bg-white/20 px-1 rounded text-xs font-mono">$1</code>',
  );

  // 7. Newlines → <br>
  text = text.replace(/\n/g, "<br>");

  return text;
}
