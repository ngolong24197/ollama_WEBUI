import { useState, useCallback } from "react"
import {
  uploadDocument,
  listKnowledgeSources,
  deleteKnowledgeSource,
} from "@/lib/api"
import type { KnowledgeSourceResponse } from "@/types"

export function useDocuments() {
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSourceResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSources = useCallback(async () => {
    try {
      const sources = await listKnowledgeSources()
      setKnowledgeSources(sources)
    } catch {
      // sources may not be available yet
    }
  }, [])

  const upload = useCallback(async (file: File) => {
    setLoading(true)
    setError(null)
    try {
      const source = await uploadDocument(file)
      setKnowledgeSources((prev) => [source, ...prev])
      return source
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload document")
      return undefined
    } finally {
      setLoading(false)
    }
  }, [])

  const removeSource = useCallback(async (id: number) => {
    try {
      await deleteKnowledgeSource(id)
      setKnowledgeSources((prev) => prev.filter((s) => s.id !== id))
    } catch {
      setError("Failed to delete knowledge source")
    }
  }, [])

  return {
    knowledgeSources,
    loading,
    error,
    fetchSources,
    uploadDocument: upload,
    removeSource,
    setError,
  }
}