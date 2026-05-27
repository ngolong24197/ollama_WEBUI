import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";

export function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.removeAttribute("data-highlighted");
      hljs.highlightElement(codeRef.current);
    }
  }, [language, code]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div className="my-2 overflow-hidden rounded-lg border border-border bg-[#1e1e2e]">
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-1.5">
        <span className="text-xs font-medium text-muted-foreground">{language}</span>
        <button
          onClick={handleCopy}
          className="rounded px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="m-0 overflow-x-auto p-4">
        <code ref={codeRef} className={cn(`language-${language}`, "text-sm leading-relaxed")}>
          {code}
        </code>
      </pre>
    </div>
  );
}