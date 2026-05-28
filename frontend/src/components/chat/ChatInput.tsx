import { useState, useCallback, useRef } from "react"
import { cn } from "@/lib/utils"
import { ImageAttach } from "@/components/attachments/ImageAttach"
import { FileAttach } from "@/components/attachments/FileAttach"
import type { AnalyzeFile, KnowledgeSourceResponse } from "@/types"

interface ChatInputProps {
  onSend: (message: string, options?: {
    imageUrls?: string[]
    analysisText?: string
    analysisFileName?: string
    knowledgeSourceIds?: number[]
  }) => void
  disabled?: boolean
  analyzeFiles: AnalyzeFile[]
  knowledgeSources: KnowledgeSourceResponse[]
  selectedSourceIds: number[]
  onAnalyzeFile: (file: File) => void
  onUploadToKnowledge: (file: File) => Promise<KnowledgeSourceResponse | undefined>
  onRemoveAnalyzeFile: (name: string) => void
  onRemoveKnowledgeSource: (id: number) => void
  onToggleSource: (id: number) => void
  docLoading: boolean
  docError: string | null
}

export function ChatInput({
  onSend,
  disabled,
  analyzeFiles,
  knowledgeSources,
  selectedSourceIds,
  onAnalyzeFile,
  onUploadToKnowledge,
  onRemoveAnalyzeFile,
  onRemoveKnowledgeSource,
  onToggleSource,
  docLoading,
  docError,
}: ChatInputProps) {
  const [input, setInput] = useState("")
  const [images, setImages] = useState<string[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = input.trim()
      if (!trimmed || disabled) return

      const analysisText = analyzeFiles.length > 0
        ? analyzeFiles.map((f) => `[${f.name}]\n${f.text}`).join("\n\n")
        : undefined
      const analysisFileName = analyzeFiles.length > 0
        ? analyzeFiles.map((f) => f.name).join(", ")
        : undefined
      const knowledgeSourceIds = selectedSourceIds.length > 0
        ? selectedSourceIds
        : undefined

      onSend(trimmed, {
        imageUrls: images.length > 0 ? images : undefined,
        analysisText,
        analysisFileName,
        knowledgeSourceIds,
      })
      setInput("")
      setImages([])
    },
    [input, disabled, onSend, images, analyzeFiles, selectedSourceIds]
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
          analyzeFiles={analyzeFiles}
          knowledgeSources={knowledgeSources}
          selectedSourceIds={selectedSourceIds}
          onAnalyzeFile={onAnalyzeFile}
          onUploadToKnowledge={onUploadToKnowledge}
          onRemoveAnalyzeFile={onRemoveAnalyzeFile}
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