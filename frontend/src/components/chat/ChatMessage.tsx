import { cn } from "@/lib/utils"
import type { Message } from "@/types"
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer"
import { TokenCounter } from "./TokenCounter"
import { StreamingCursor } from "./StreamingCursor"

interface ChatMessageProps {
  message: Message
  isStreaming?: boolean
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === "user"
  const isSystem = message.role === "system"

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2",
          isUser && "bg-primary text-primary-foreground",
          isSystem && "bg-muted text-muted-foreground italic text-sm",
          !isUser && !isSystem && "bg-card text-card-foreground border border-border"
        )}
      >
        <div className="text-xs text-muted-foreground mb-1">
          {isUser ? "You" : isSystem ? "System" : "Assistant"}
        </div>

        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-invert max-w-none text-sm">
            <MarkdownRenderer content={message.content} />
          </div>
        )}

        {isStreaming && <StreamingCursor />}

        {!isStreaming && message.completionTokens > 0 && (
          <TokenCounter message={message} />
        )}

        {message.imageUrls && message.imageUrls.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.imageUrls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Attachment ${i + 1}`}
                className="max-h-40 rounded border border-border"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}