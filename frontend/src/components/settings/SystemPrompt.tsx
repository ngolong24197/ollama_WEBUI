import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SystemPromptProps {
  prompt: string | null
  onPromptChange: (prompt: string | null) => void
}

export function SystemPrompt({ prompt, onPromptChange }: SystemPromptProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(prompt ?? "")

  const handleSave = useCallback(() => {
    const trimmed = draft.trim()
    onPromptChange(trimmed || null)
  }, [draft, onPromptChange])

  const handleReset = useCallback(() => {
    setDraft("")
    onPromptChange(null)
  }, [onPromptChange])

  const preview = prompt
    ? prompt.length > 50 ? prompt.slice(0, 50) + "..." : prompt
    : "No system prompt"

  return (
    <div className="rounded-lg border border-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
      >
        <span className="flex items-center gap-2">
          System Prompt
          {prompt && (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs text-primary">Set</span>
          )}
        </span>
        <span className="text-xs text-muted-foreground">{open ? "Collapse" : preview}</span>
      </button>
      {open && (
        <div className="border-t border-border p-3 space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Enter system prompt..."
            rows={4}
            className={cn(
              "w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm",
              "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            )}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={handleReset}>Reset</Button>
            <Button size="sm" onClick={handleSave}>Save</Button>
          </div>
        </div>
      )}
    </div>
  )
}