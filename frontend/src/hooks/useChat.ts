import { useState, useCallback, useRef, useEffect } from "react"
import { streamChat, getMessages, ApiError } from "@/lib/api"
import type { Message, TokenCount } from "@/types"

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

export interface SendMessageOptions {
  systemPrompt?: string
  imageUrls?: string[]
  enableSearch?: boolean
  knowledgeSourceIds?: number[]
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [canRetry, setCanRetry] = useState(false)
  const lastRequestRef = useRef<{
    content: string
    model: string
    options?: SendMessageOptions
  } | null>(null)
  const streamingRef = useRef<string>("")
  const abortRef = useRef<AbortController | null>(null)

  // Load messages when switching to a different conversation
  useEffect(() => {
    if (conversationId === null) {
      setMessages([])
      return
    }
    let cancelled = false
    getMessages(conversationId).then((msgs) => {
      if (!cancelled) {
        setMessages(msgs)
      }
    }).catch(() => {
      if (!cancelled) {
        setMessages([])
      }
    })
    return () => { cancelled = true }
  }, [conversationId])

  // Abort streaming on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const sendMessage = useCallback(
    async (
      content: string,
      model: string,
      options?: SendMessageOptions
    ) => {
      setError(null)
      setIsStreaming(true)
      setIsLoading(true)
      setCanRetry(false)
      streamingRef.current = ""
      lastRequestRef.current = { content, model, options }

      const userMessage: Message = {
        id: generateId(),
        conversationId: String(conversationId ?? ""),
        role: "user",
        content,
        promptTokens: 0,
        completionTokens: 0,
        imageUrls: options?.imageUrls ?? null,
        searchEnabled: options?.enableSearch,
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
        searchEnabled: options?.enableSearch,
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
            knowledgeSourceIds: options?.knowledgeSourceIds,
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
            setCanRetry(true)
          },
          (id: number) => {
            setConversationId(id)
          }
        )

        if (streamingRef.current === "" && !error) {
          setError("No response received. Please try again.")
          setCanRetry(true)
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.detail)
        } else {
          setError("An unexpected error occurred.")
        }
        setCanRetry(true)
      } finally {
        setIsStreaming(false)
        setIsLoading(false)
      }
    },
    [conversationId, error]
  )

  const retry = useCallback(() => {
    const last = lastRequestRef.current
    if (!last) return
    setMessages((prev) => prev.slice(0, -1))
    sendMessage(last.content, last.model, last.options)
  }, [sendMessage])

  const clearMessages = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setConversationId(null)
    setError(null)
    setCanRetry(false)
  }, [])

  return {
    messages,
    isStreaming,
    isLoading,
    error,
    canRetry,
    conversationId,
    sendMessage,
    retry,
    clearMessages,
    setConversationId,
  }
}