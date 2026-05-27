import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { checkHealth } from "@/lib/api"

interface SearchToggleProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
}

export function SearchToggle({ enabled, onToggle }: SearchToggleProps) {
  const [searxngAvailable, setSearxngAvailable] = useState(true)

  useEffect(() => {
    let cancelled = false
    checkHealth().then((status) => {
      if (!cancelled) setSearxngAvailable(status.searxng)
    }).catch(() => {
      if (!cancelled) setSearxngAvailable(false)
    })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">Web Search</span>
        {!searxngAvailable && (
          <span className="text-xs text-muted-foreground">SearXNG is unavailable</span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={!searxngAvailable}
        onClick={() => onToggle(!enabled)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full",
          "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          enabled ? "bg-primary" : "bg-input",
          !searxngAvailable && "opacity-50 cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block size-4 rounded-full bg-background shadow-sm",
            "transition-transform duration-150",
            enabled ? "translate-x-4" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  )
}