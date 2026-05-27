import { useState, useCallback, useEffect } from "react"
import { listConversations, createConversation, deleteConversation as apiDeleteConversation } from "@/lib/api"
import type { Conversation } from "@/types"

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await listConversations()
      setConversations(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversations")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  const addConversation = useCallback(
    async (title: string, model: string, systemPrompt?: string) => {
      try {
        const conv = await createConversation(title, model, systemPrompt)
        setConversations((prev) => [conv, ...prev])
        return conv
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create conversation")
        return null
      }
    },
    []
  )

  const removeConversation = useCallback(async (id: number) => {
    try {
      await apiDeleteConversation(id)
      setConversations((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete conversation")
    }
  }, [])

  return {
    conversations,
    loading,
    error,
    fetchConversations,
    addConversation,
    removeConversation,
  }
}