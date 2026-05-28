import type {
  ChatRequest,
  Conversation,
  ErrorResponse,
  HealthStatus,
  KnowledgeSourceResponse,
  Message,
  OllamaModel,
  SearchResult,
  SSEEvent,
  TokenCount,
} from "@/types"

const API_BASE = "/api"

class ApiError extends Error {
  type: string
  detail: string

  constructor(error: string, detail: string) {
    super(detail)
    this.type = error
    this.detail = detail
  }
}

async function parseError(response: Response): Promise<never> {
  try {
    const body: ErrorResponse = await response.json()
    throw new ApiError(body.error, body.detail)
  } catch {
    throw new ApiError("network_error", `Request failed: ${response.status}`)
  }
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })
  if (!response.ok) {
    await parseError(response)
  }
  return response.json()
}

export async function checkHealth(): Promise<HealthStatus> {
  return fetchJson("/health")
}

export async function listModels(): Promise<OllamaModel[]> {
  return fetchJson("/models")
}

export async function listConversations(): Promise<Conversation[]> {
  return fetchJson("/conversations")
}

export async function getConversation(id: number): Promise<Conversation> {
  return fetchJson(`/conversations/${id}`)
}

export async function createConversation(
  title: string,
  model: string,
  systemPrompt?: string
): Promise<Conversation> {
  return fetchJson("/conversations", {
    method: "POST",
    body: JSON.stringify({ title, model, systemPrompt }),
  })
}

export async function deleteConversation(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/conversations/${id}`, {
    method: "DELETE",
  })
  if (!response.ok) {
    await parseError(response)
  }
}

export async function getMessages(conversationId: number): Promise<Message[]> {
  return fetchJson(`/conversations/${conversationId}/messages`)
}

export async function search(query: string): Promise<SearchResult[]> {
  return fetchJson(`/search?q=${encodeURIComponent(query)}`)
}

export async function exportConversation(id: number): Promise<Blob> {
  const response = await fetch(`${API_BASE}/conversations/${id}/export?format=docx`)
  if (!response.ok) {
    await parseError(response)
  }
  return response.blob()
}

export async function streamChat(
  request: ChatRequest,
  onToken: (text: string) => void,
  onDone: (tokenCount: TokenCount) => void,
  onError: (error: string) => void,
  onConversationId?: (id: number) => void
): Promise<void> {
  const response = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    await parseError(response)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new ApiError("stream_error", "No response body")
  }

  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue
        const raw = line.slice(6).trim()
        if (!raw) continue

        try {
          const event: SSEEvent = JSON.parse(raw)
          switch (event.type) {
            case "token":
              onToken(event.data)
              break
            case "done": {
              const count: TokenCount = JSON.parse(event.data)
              onDone(count)
              break
            }
            case "conversation_id": {
              const id = Number(event.data)
              if (!isNaN(id) && onConversationId) onConversationId(id)
              break
            }
            case "error":
              onError(event.data)
              break
          }
        } catch {
          continue
        }
      }
    }
  } catch {
    onError("Stream connection lost. Please try again.")
  }
}

export { ApiError }

export async function analyzeDocument(file: File): Promise<{ text: string; file_name: string }> {
  const formData = new FormData()
  formData.append("file", file)
  const response = await fetch(`${API_BASE}/documents/analyze`, {
    method: "POST",
    body: formData,
  })
  if (!response.ok) {
    await parseError(response)
  }
  return response.json()
}

export async function uploadDocument(file: File): Promise<KnowledgeSourceResponse> {
  const formData = new FormData()
  formData.append("file", file)
  const response = await fetch(`${API_BASE}/documents/upload`, {
    method: "POST",
    body: formData,
  })
  if (!response.ok) {
    await parseError(response)
  }
  return response.json()
}

export async function listKnowledgeSources(): Promise<KnowledgeSourceResponse[]> {
  return fetchJson("/documents/knowledge-sources")
}

export async function deleteKnowledgeSource(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/documents/knowledge-sources/${id}`, {
    method: "DELETE",
  })
  if (!response.ok && response.status !== 204) {
    await parseError(response)
  }
}