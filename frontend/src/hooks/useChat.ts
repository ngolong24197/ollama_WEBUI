import { useState, useCallback, useRef } from "react"
import { streamChat, ApiError } from "@/lib/api"
import type { Message, TokenCount } from "@/types"

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<number | null>(null)
  const streamingRef = useRef<string>("")

  const sendMessage = useCallback(
    async (
      content: string,
      model: string,
      options?: {
        systemPrompt?: string
        imageUrls?: string[]
        enableSearch?: boolean
      }
    ) => {
      setError(null)
      setIsStreaming(true)
      streamingRef.current = ""

      const userMessage: Message = {
        id: generateId(),
        conversationId: String(conversationId ?? ""),
        role: "user",
        content,
        promptTokens: 0,
        completionTokens: 0,
        imageUrls: options?.imageUrls ?? null,
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userMessage])

      const assistantMessage: Message = {
        id: generateId(),
        conversationId: String(conversationId ?? ""),
        role: "assistant",
        content: "",
        promptTokens: 0,
        completionTokens: 0,
        imageUrls: null,
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMessage])

      try {
        await streamChat(
          {
            message: content,
            model,
            conversationId: conversationId ?? undefined,
            systemPrompt: options?.systemPrompt,
            imageUrls: options?.imageUrls,
            enableSearch: options?.enableSearch,
          },
          (token) => {
            streamingRef.current += token
            setMessages((prev) => {
              const updated = [...prev]
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: streamingRef.current,
              }
              return updated
            })
          },
          (tokenCount: TokenCount) => {
            setMessages((prev) => {
              const updated = [...prev]
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                promptTokens: tokenCount.promptTokens,
                completionTokens: tokenCount.completionTokens,
              }
              return updated
            })
          },
          (errMsg) => {
            setError(errMsg)
          }
        )

        if (streamingRef.current === "" && !error) {
          setError("No response received. Please try again.")
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.detail)
        } else {
          setError("An unexpected error occurred.")
        }
      } finally {
        setIsStreaming(false)
      }
    },
    [conversationId, error]
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    setConversationId(null)
    setError(null)
  }, [])

  return {
    messages,
    isStreaming,
    error,
    conversationId,
    sendMessage,
    clearMessages,
    setConversationId,
  }
}