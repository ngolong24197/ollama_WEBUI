import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { ImageAttach } from "@/components/attachments/ImageAttach"

interface ChatInputProps {
  onSend: (message: string, imageUrls?: string[]) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("")
  const [images, setImages] = useState<string[]>([])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = input.trim()
      if (!trimmed || disabled) return
      onSend(trimmed, images.length > 0 ? images : undefined)
      setInput("")
      setImages([])
    },
    [input, disabled, onSend, images]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSubmit(e)
      }
    },
    [handleSubmit]
  )

  return (
    <div className="border-t border-border p-4">
      <div className="max-w-4xl mx-auto space-y-2">
        {images.length > 0 && (
          <ImageAttach images={images} onImagesChange={setImages} />
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            disabled={disabled}
            rows={1}
            className={cn(
              "flex-1 resize-none rounded-lg border border-input bg-background px-4 py-2.5",
              "text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "min-h-[44px] max-h-[200px] overflow-y-auto"
            )}
          />
          <button
            type="submit"
            disabled={disabled || !input.trim()}
            className={cn(
              "rounded-lg px-4 py-2.5 font-medium text-sm",
              "bg-primary text-primary-foreground",
              "hover:bg-primary/90",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors"
            )}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}