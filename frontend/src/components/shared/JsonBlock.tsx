import { useState, useMemo } from "react";

export function JsonBlock({ rawJson }: { rawJson: string }) {
  const [expanded, setExpanded] = useState(false);

  const formatted = useMemo(() => {
    try {
      return JSON.stringify(JSON.parse(rawJson), null, 2);
    } catch {
      return rawJson;
    }
  }, [rawJson]);

  const firstLine = formatted.split("\n")[0] ?? "";

  return (
    <div className="my-2 overflow-hidden rounded-lg border border-border bg-[#1e1e2e]">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between border-b border-border bg-muted/50 px-4 py-1.5 text-left"
      >
        <span className="text-xs font-medium text-muted-foreground">JSON</span>
        <span className="text-xs text-muted-foreground">
          {expanded ? "Collapse" : "Expand"}
        </span>
      </button>
      {expanded ? (
        <pre className="m-0 overflow-x-auto p-4 text-sm leading-relaxed">
          <code className="language-json">{formatted}</code>
        </pre>
      ) : (
        <pre className="m-0 truncate px-4 py-2 text-sm text-muted-foreground">
          {firstLine}
          {formatted.includes("\n") ? " …" : ""}
        </pre>
      )}
    </div>
  );
}