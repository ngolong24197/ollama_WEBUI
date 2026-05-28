import { useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { FileChip } from "./FileChip"
import type { AnalyzeFile, KnowledgeSourceResponse } from "@/types"

const ACCEPTED_EXTENSIONS = ".pdf,.docx,.txt"
const MAX_SIZE_MB = 20

interface FileAttachProps {
  analyzeFiles: AnalyzeFile[]
  knowledgeSources: KnowledgeSourceResponse[]
  selectedSourceIds: number[]
  onAnalyzeFile: (file: File) => void
  onUploadToKnowledge: (file: File) => Promise<KnowledgeSourceResponse | undefined>
  onRemoveAnalyzeFile: (name: string) => void
  onRemoveKnowledgeSource: (id: number) => void
  onToggleSource: (id: number) => void
  loading: boolean
  error: string | null
}

export function FileAttach({
  analyzeFiles,
  knowledgeSources,
  selectedSourceIds,
  onAnalyzeFile,
  onUploadToKnowledge,
  onRemoveAnalyzeFile,
  onRemoveKnowledgeSource,
  onToggleSource,
  loading,
  error,
}: FileAttachProps) {
  const [mode, setMode] = useState<"analyze" | "knowledge">("analyze")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return
    }

    if (mode === "analyze") {
      onAnalyzeFile(file)
    } else {
      await onUploadToKnowledge(file)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        <button
          onClick={() => setMode("analyze")}
          className={cn(
            "rounded-md px-3 py-1 text-xs font-medium transition-colors",
            mode === "analyze"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-accent"
          )}
        >
          Analyze
        </button>
        <button
          onClick={() => setMode("knowledge")}
          className={cn(
            "rounded-md px-3 py-1 text-xs font-medium transition-colors",
            mode === "knowledge"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-accent"
          )}
        >
          Knowledge Source
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        className="hidden"
        onChange={handleFileSelect}
      />

      {mode === "analyze" ? (
        <div className="space-y-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-md border border-dashed border-gray-400 px-3 py-1.5 text-xs text-gray-600 hover:border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            + Add document
          </button>
          {analyzeFiles.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {analyzeFiles.map((f) => (
                <FileChip key={f.name} name={f.name} onRemove={() => onRemoveAnalyzeFile(f.name)} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-md border border-dashed border-gray-400 px-3 py-1.5 text-xs text-gray-600 hover:border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Uploading..." : "+ Upload to knowledge base"}
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
                  <span className="text-xs text-muted-foreground">{source.chunk_count} chunks</span>
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
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}