import type { Conversation } from "@/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ConversationItem } from "./ConversationItem"

interface SidebarProps {
  conversations: Conversation[]
  activeId: number | null
  onSelect: (id: number) => void
  onNew: () => void
  onDelete: (id: number) => void
}

export function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex w-72 flex-col",
        "border-r border-border bg-background",
        "hidden md:flex"
      )}
    >
      <div className="flex items-center gap-2 border-b border-border p-3">
        <Button onClick={onNew} variant="outline" size="sm" className="w-full">
          + New Chat
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {conversations.length === 0 && (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            No conversations yet
          </p>
        )}
        {conversations.map((conv) => (
          <ConversationItem
            key={conv.id}
            conversation={conv}
            isActive={conv.id === activeId}
            onSelect={() => onSelect(conv.id)}
            onDelete={() => onDelete(conv.id)}
          />
        ))}
      </nav>
    </aside>
  )
}