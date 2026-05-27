import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { Components } from "react-markdown";
import { CodeBlock } from "./CodeBlock";
import { JsonBlock } from "./JsonBlock";

function isJson(code: string): boolean {
  const trimmed = code.trim();
  if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) return false;
  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
}

const components: Components = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    const code = String(children).replace(/\n$/, "");
    if (match) {
      if (isJson(code)) return <JsonBlock rawJson={code} />;
      return <CodeBlock language={match[1]} code={code} />;
    }
    return (
      <code className="rounded bg-muted px-1.5 py-0.5 text-sm" {...props}>
        {children}
      </code>
    );
  },
  a({ href, children, ...props }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 underline hover:text-blue-400"
        {...props}
      >
        {children}
      </a>
    );
  },
  table({ children, ...props }) {
    return (
      <div className="my-2 overflow-x-auto">
        <table className="w-full border-collapse text-sm" {...props}>
          {children}
        </table>
      </div>
    );
  },
  th({ children, ...props }) {
    return (
      <th className="border border-border bg-muted px-3 py-1.5 text-left font-semibold" {...props}>
        {children}
      </th>
    );
  },
  td({ children, ...props }) {
    return (
      <td className="border border-border px-3 py-1.5" {...props}>
        {children}
      </td>
    );
  },
  ul({ children, ...props }) {
    return (
      <ul className="ml-4 list-disc space-y-1" {...props}>
        {children}
      </ul>
    );
  },
  ol({ children, ...props }) {
    return (
      <ol className="ml-4 list-decimal space-y-1" {...props}>
        {children}
      </ol>
    );
  },
};

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-invert max-w-none text-sm leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}