export interface Message {
  id: string
  conversationId: string
  role: "user" | "assistant" | "system"
  content: string
  promptTokens: number
  completionTokens: number
  imageUrls: string[] | null
  searchEnabled?: boolean
  createdAt: string
}

export interface Conversation {
  id: number
  title: string
  model: string
  systemPrompt: string | null
  totalTokens: number
  createdAt: string
  updatedAt: string
}

export interface ChatRequest {
  message: string
  model: string
  conversationId?: number
  systemPrompt?: string
  imageUrls?: string[]
  enableSearch?: boolean
}

export interface SearchRequest {
  query: string
}

export interface SearchResult {
  title: string
  url: string
  snippet: string
}

export interface SSEEvent {
  type: "token" | "done" | "error" | "conversation_id"
  data: string
}

export interface TokenCount {
  promptTokens: number
  completionTokens: number
}

export interface OllamaModel {
  name: string
  modified_at: string
  size: number
}

export interface HealthStatus {
  status: string
  ollama: boolean
  searxng: boolean
}

export interface ErrorResponse {
  error: string
  detail: string
}