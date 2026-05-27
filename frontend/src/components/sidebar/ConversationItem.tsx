import type { Conversation } from "@/types"
import { cn } from "@/lib/utils"
import { SessionTokenCount } from "./SessionTokenCount"

interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
}

export function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
}: ConversationItemProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "group relative flex w-full flex-col rounded-md px-3 py-2 text-left",
        "transition-colors hover:bg-accent",
        isActive && "bg-accent"
      )}
    >
      <span className="truncate text-sm font-medium leading-tight">
        {conversation.title || "Untitled"}
      </span>
      <span className="truncate text-xs text-muted-foreground">
        {conversation.model}
      </span>
      <SessionTokenCount totalTokens={conversation.totalTokens} />

      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            e.stopPropagation()
            onDelete()
          }
        }}
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2",
          "rounded p-1 text-muted-foreground opacity-0 transition-opacity",
          "hover:bg-destructive/20 hover:text-destructive",
          "group-hover:opacity-100 focus:opacity-100"
        )}
        aria-label="Delete conversation"
      >
        &times;
      </span>
    </button>
  )
}