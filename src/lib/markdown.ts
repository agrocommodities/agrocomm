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
