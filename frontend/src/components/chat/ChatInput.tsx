import { useState, useCallback, useRef } from "react"
import { cn } from "@/lib/utils"
import { ImageAttach } from "@/components/attachments/ImageAttach"
import { FileAttach } from "@/components/attachments/FileAttach"
import type { KnowledgeSourceResponse } from "@/types"

interface ChatInputProps {
  onSend: (message: string, options?: {
    imageUrls?: string[]
    knowledgeSourceIds?: number[]
  }) => void
  disabled?: boolean
  knowledgeSources: KnowledgeSourceResponse[]
  selectedSourceIds: number[]
  onUploadDocument: (file: File) => Promise<KnowledgeSourceResponse | undefined>
  onRemoveKnowledgeSource: (id: number) => void
  onToggleSource: (id: number) => void
  docLoading: boolean
  docError: string | null
}

export function ChatInput({
  onSend,
  disabled,
  knowledgeSources,
  selectedSourceIds,
  onUploadDocument,
  onRemoveKnowledgeSource,
  onToggleSource,
  docLoading,
  docError,
}: ChatInputProps) {
  const [input, setInput] = useState("")
  const [images, setImages] = useState<string[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const hasAttachments = selectedSourceIds.length > 0 || images.length > 0

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = input.trim()
      if ((!trimmed && !hasAttachments) || disabled) return

      const knowledgeSourceIds = selectedSourceIds.length > 0
        ? selectedSourceIds
        : undefined

      onSend(trimmed || "Please analyze the attached document.", {
        imageUrls: images.length > 0 ? images : undefined,
        knowledgeSourceIds,
      })
      setInput("")
      setImages([])
    },
    [input, disabled, onSend, images, selectedSourceIds, hasAttachments]
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

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const files = e.clipboardData.files
      if (files.length > 0) {
        const file = files[0]
        if (file.type.startsWith("image/")) {
          e.preventDefault()
          const reader = new FileReader()
          reader.onload = () => {
            if (typeof reader.result === "string") {
              setImages((prev) => [...prev, reader.result as string])
            }
          }
          reader.readAsDataURL(file)
        }
      }
    },
    []
  )

  return (
    <div className="border-t border-border p-4">
      <div className="mx-auto max-w-4xl space-y-2">
        <FileAttach
          knowledgeSources={knowledgeSources}
          selectedSourceIds={selectedSourceIds}
          onUploadDocument={onUploadDocument}
          onRemoveKnowledgeSource={onRemoveKnowledgeSource}
          onToggleSource={onToggleSource}
          loading={docLoading}
          error={docError}
        />
        <ImageAttach images={images} onImagesChange={setImages} />
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Send a message... (paste or attach images)"
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
            disabled={disabled || (!input.trim() && !hasAttachments)}
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