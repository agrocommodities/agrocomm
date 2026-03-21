"use client";

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  type ChangeEvent,
} from "react";
import {
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  List,
  Palette,
  Eye,
  Code,
} from "lucide-react";
import { setMarkdownHtml } from "@/lib/markdown";

const COLORS = [
  { label: "Branco", value: "#ffffff" },
  { label: "Verde", value: "#4ade80" },
  { label: "Amarelo", value: "#fbbf24" },
  { label: "Vermelho", value: "#f87171" },
  { label: "Azul", value: "#60a5fa" },
  { label: "Laranja", value: "#fb923c" },
  { label: "Rosa", value: "#f472b6" },
  { label: "Ciano", value: "#22d3ee" },
];

interface MarkdownEditorProps {
  name: string;
  id?: string;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  defaultValue?: string;
  inputClassName?: string;
}

export default function MarkdownEditor({
  name,
  id,
  required,
  maxLength,
  placeholder,
  defaultValue = "",
  inputClassName = "",
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);
  const [showSource, setShowSource] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [value, setValue] = useState(defaultValue);

  // Close color picker on outside click
  useEffect(() => {
    if (!showColors) return;
    function handleClick(e: MouseEvent) {
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) {
        setShowColors(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showColors]);

  // Update preview content via ref
  useEffect(() => {
    if (!showSource && previewRef.current) {
      setMarkdownHtml(previewRef.current, value);
    }
  }, [showSource, value]);

  const ensureSource = useCallback(() => {
    if (!showSource) setShowSource(true);
  }, [showSource]);

  const wrapSelection = useCallback(
    (before: string, after: string) => {
      ensureSource();
      requestAnimationFrame(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const { selectionStart, selectionEnd } = textarea;
        const text = textarea.value;
        const selected = text.slice(selectionStart, selectionEnd);
        const inner = selected || "texto";
        const replacement = `${before}${inner}${after}`;
        const newText =
          text.slice(0, selectionStart) +
          replacement +
          text.slice(selectionEnd);
        setValue(newText);
        requestAnimationFrame(() => {
          textarea.focus();
          const start = selectionStart + before.length;
          textarea.setSelectionRange(start, start + inner.length);
        });
      });
    },
    [ensureSource],
  );

  const insertLinePrefix = useCallback(
    (prefix: string) => {
      ensureSource();
      requestAnimationFrame(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const { selectionStart, selectionEnd } = textarea;
        const text = textarea.value;
        const lineStart = text.lastIndexOf("\n", selectionStart - 1) + 1;
        const lineEndIdx = text.indexOf("\n", selectionEnd);
        const actualEnd = lineEndIdx === -1 ? text.length : lineEndIdx;
        const lineContent = text.slice(lineStart, actualEnd);
        const trimmed = lineContent.trimStart();
        let newLine: string;
        if (trimmed.startsWith(prefix)) {
          newLine = trimmed.slice(prefix.length);
        } else {
          newLine = `${prefix}${trimmed || "texto"}`;
        }
        const newText =
          text.slice(0, lineStart) + newLine + text.slice(actualEnd);
        setValue(newText);
        requestAnimationFrame(() => {
          textarea.focus();
          textarea.setSelectionRange(
            lineStart + prefix.length,
            lineStart + newLine.length,
          );
        });
      });
    },
    [ensureSource],
  );

  const applyColor = useCallback(
    (color: string) => {
      wrapSelection(`{color:${color}}`, "{/color}");
      setShowColors(false);
    },
    [wrapSelection],
  );

  const btnClass =
    "p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors";

  return (
    <div className="flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 flex-wrap bg-white/5 border border-white/15 rounded-t-lg px-2 py-1">
        <button
          type="button"
          title="Título (## )"
          onClick={() => insertLinePrefix("## ")}
          className={btnClass}
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="Subtítulo (### )"
          onClick={() => insertLinePrefix("### ")}
          className={btnClass}
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        <button
          type="button"
          title="Negrito (**texto**)"
          onClick={() => wrapSelection("**", "**")}
          className={btnClass}
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="Itálico (*texto*)"
          onClick={() => wrapSelection("*", "*")}
          className={btnClass}
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="Sublinhado (++texto++)"
          onClick={() => wrapSelection("++", "++")}
          className={btnClass}
        >
          <Underline className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        <button
          type="button"
          title="Lista (- item)"
          onClick={() => insertLinePrefix("- ")}
          className={btnClass}
        >
          <List className="w-4 h-4" />
        </button>

        <div className="relative" ref={colorRef}>
          <button
            type="button"
            title="Cor do texto"
            onClick={() => setShowColors(!showColors)}
            className={btnClass}
          >
            <Palette className="w-4 h-4" />
          </button>
          {showColors && (
            <div className="absolute top-full left-0 mt-1 bg-[#2a3925] border border-white/20 rounded-lg p-2 flex gap-1.5 z-50 shadow-xl">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => applyColor(c.value)}
                  className="w-6 h-6 rounded-full border-2 border-white/20 hover:border-white/60 transition-colors hover:scale-110"
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />

        <button
          type="button"
          title="Mostrar código"
          onClick={() => setShowSource(true)}
          className={`${btnClass} ${showSource ? "bg-white/10 text-white" : ""}`}
        >
          <Code className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="Visualizar"
          onClick={() => setShowSource(false)}
          className={`${btnClass} ${!showSource ? "bg-white/10 text-white" : ""}`}
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Hidden input to keep value in form when source is hidden */}
      {!showSource && <input type="hidden" name={name} value={value} />}

      {/* Editor / Preview */}
      {showSource ? (
        <textarea
          ref={textareaRef}
          id={id}
          name={name}
          required={required}
          maxLength={maxLength}
          placeholder={placeholder}
          value={value}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
            setValue(e.target.value)
          }
          rows={5}
          className={`${inputClassName} rounded-t-none border-t-0`}
        />
      ) : (
        <div
          ref={previewRef}
          className={`${inputClassName} rounded-t-none border-t-0 min-h-[130px] markdown-preview`}
        />
      )}
    </div>
  );
}
