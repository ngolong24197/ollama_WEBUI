import { useState, useCallback } from "react"
import {
  analyzeDocument,
  uploadDocument,
  listKnowledgeSources,
  deleteKnowledgeSource,
} from "@/lib/api"
import type { AnalyzeFile, KnowledgeSourceResponse } from "@/types"

export function useDocuments() {
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSourceResponse[]>([])
  const [analyzeFiles, setAnalyzeFiles] = useState<AnalyzeFile[]>([])
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

  const analyzeFile = useCallback(async (file: File) => {
    setLoading(true)
    setError(null)
    try {
      const result = await analyzeDocument(file)
      if (result.text.startsWith("Failed") || result.text.startsWith("Unsupported")) {
        setError(result.text)
        return
      }
      const newFile: AnalyzeFile = { name: result.file_name, text: result.text }
      setAnalyzeFiles((prev) => [...prev, newFile])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze document")
    } finally {
      setLoading(false)
    }
  }, [])

  const uploadToKnowledge = useCallback(async (file: File) => {
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

  const removeAnalyzeFile = useCallback((name: string) => {
    setAnalyzeFiles((prev) => prev.filter((f) => f.name !== name))
  }, [])

  const clearAnalyzeFiles = useCallback(() => {
    setAnalyzeFiles([])
  }, [])

  return {
    knowledgeSources,
    analyzeFiles,
    loading,
    error,
    fetchSources,
    analyzeFile,
    uploadToKnowledge,
    removeSource,
    removeAnalyzeFile,
    clearAnalyzeFiles,
    setError,
  }
}