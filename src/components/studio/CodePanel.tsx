"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface CodePanelProps {
  fileName: string;
  lines: string[];
  streaming: boolean;
  reducedMotion?: boolean;
}

/** Warm, editorial-light token colors (never purple/cyan — DESIGN.md §6). */
const TOKEN_CLASS: Record<string, string> = {
  keyword: "text-[#b0450e]",
  string: "text-[#5c6b1e]",
  comment: "text-ink-muted/70 italic",
  number: "text-[#8a5a00]",
  type: "text-[#2f6b4f]",
  plain: "text-ink",
};

const KEYWORDS = new Set([
  "use", "client", "import", "from", "export", "default", "const", "let",
  "var", "function", "return", "if", "else", "for", "while", "type",
  "interface", "new", "await", "async", "as", "of", "in",
]);

const HOOKS = new Set([
  "useState", "useEffect", "useRef", "useCallback", "useMemo",
]);

interface Token {
  text: string;
  kind: keyof typeof TOKEN_CLASS;
}

/**
 * Tiny hand-rolled tokenizer — deliberately not a real highlighter (no dep).
 * Splits a line into colored spans that read as "code" at a glance.
 */
function tokenize(line: string): Token[] {
  const tokens: Token[] = [];
  const re =
    /(\/\/[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|(\s+)|([^\s\w])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    if (m[1]) tokens.push({ text: m[1], kind: "comment" });
    else if (m[2]) tokens.push({ text: m[2], kind: "string" });
    else if (m[3]) tokens.push({ text: m[3], kind: "number" });
    else if (m[4]) {
      const w = m[4];
      if (KEYWORDS.has(w)) tokens.push({ text: w, kind: "keyword" });
      else if (HOOKS.has(w)) tokens.push({ text: w, kind: "type" });
      else if (/^[A-Z]/.test(w)) tokens.push({ text: w, kind: "type" });
      else tokens.push({ text: w, kind: "plain" });
    } else if (m[5]) tokens.push({ text: m[5], kind: "plain" });
    else if (m[6]) tokens.push({ text: m[6], kind: "plain" });
  }
  return tokens;
}

export function CodePanel({
  fileName,
  lines,
  streaming,
  reducedMotion = false,
}: CodePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines.length, reducedMotion]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[--radius-md] border border-line bg-[#fbfaf9]">
      {/* Faux editor title bar */}
      <div className="flex items-center gap-3 border-b border-line bg-surface px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full border border-line bg-bg" />
          <span className="size-2.5 rounded-full border border-line bg-bg" />
          <span className="size-2.5 rounded-full border border-line bg-bg" />
        </div>
        <span className="font-mono text-xs text-ink-muted">{fileName}</span>
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-ink-muted">
          {streaming ? (
            <>
              <span
                className={cn(
                  "size-1.5 rounded-full bg-solar",
                  !reducedMotion && "animate-pulse"
                )}
              />
              Cursor
            </>
          ) : lines.length > 0 ? (
            "saved"
          ) : (
            "Cursor"
          )}
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-auto py-3 font-mono text-[12.5px] leading-[1.6]"
      >
        {lines.length === 0 ? (
          <div className="flex h-full min-h-[8rem] items-center justify-center">
            <p className="text-xs text-ink-muted/70">awaiting code stream…</p>
          </div>
        ) : (
          <pre className="min-w-full">
            <code>
              {lines.map((line, i) => (
                <div
                  key={i}
                  className="flex px-0 hover:bg-surface/60"
                >
                  <span className="w-10 shrink-0 select-none pr-3 text-right text-ink-muted/50">
                    {i + 1}
                  </span>
                  <span className="flex-1 whitespace-pre pr-4">
                    {tokenize(line).map((tok, j) => (
                      <span key={j} className={TOKEN_CLASS[tok.kind]}>
                        {tok.text}
                      </span>
                    ))}
                    {streaming && i === lines.length - 1 && (
                      <span
                        className={cn(
                          "ml-px inline-block h-[1.05em] w-[7px] translate-y-[0.15em] bg-solar/80",
                          !reducedMotion && "animate-pulse"
                        )}
                      />
                    )}
                  </span>
                </div>
              ))}
            </code>
          </pre>
        )}
      </div>
    </div>
  );
}
