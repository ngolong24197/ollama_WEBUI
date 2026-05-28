import { useRef } from "react"
import type { KnowledgeSourceResponse } from "@/types"

const ACCEPTED_EXTENSIONS = ".pdf,.docx,.txt"
const MAX_SIZE_MB = 20

interface FileAttachProps {
  knowledgeSources: KnowledgeSourceResponse[]
  selectedSourceIds: number[]
  onUploadDocument: (file: File) => Promise<KnowledgeSourceResponse | undefined>
  onRemoveKnowledgeSource: (id: number) => void
  onToggleSource: (id: number) => void
  loading: boolean
  error: string | null
}

export function FileAttach({
  knowledgeSources,
  selectedSourceIds,
  onUploadDocument,
  onRemoveKnowledgeSource,
  onToggleSource,
  loading,
  error,
}: FileAttachProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return
    }

    await onUploadDocument(file)
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        className="hidden"
        onChange={handleFileSelect}
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="inline-flex items-center gap-1 rounded-md border border-dashed border-gray-400 px-3 py-1.5 text-xs text-gray-600 hover:border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? "Uploading & summarizing..." : "+ Upload document"}
      </button>

      {knowledgeSources.length > 0 && (
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {knowledgeSources.map((source) => (
            <div key={source.id} className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1">
              <input
                type="checkbox"
                checked={selectedSourceIds.includes(source.id)}
                onChange={() => onToggleSource(source.id)}
                className="h-3 w-3 rounded"
              />
              <span className="flex-1 truncate text-xs text-foreground">{source.name}</span>
              <span className="text-xs text-muted-foreground">{source.chunkCount} chunks</span>
              <button
                onClick={() => onRemoveKnowledgeSource(source.id)}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}