import { useState } from "react"
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
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-background transition-all duration-200",
        collapsed ? "w-14" : "w-64"
      )}
    >
      <div className="flex items-center gap-2 border-b border-border p-3">
        {!collapsed && (
          <Button onClick={onNew} variant="outline" size="sm" className="w-full">
            + New Chat
          </Button>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="shrink-0 rounded-md border border-input p-1.5 text-sm hover:bg-accent transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? "▸" : "◂"}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {conversations.length === 0 && !collapsed && (
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
            collapsed={collapsed}
          />
        ))}
      </nav>
    </aside>
  )
}