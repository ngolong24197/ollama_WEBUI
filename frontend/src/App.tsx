import { useState, useEffect } from "react"
import { ThemeProvider, useTheme } from "@/components/shared/ThemeProvider"
import { ChatView } from "@/components/chat/ChatView"
import { ChatInput } from "@/components/chat/ChatInput"
import { Sidebar } from "@/components/sidebar/Sidebar"
import { ModelInput } from "@/components/settings/ModelInput"
import { SystemPrompt } from "@/components/settings/SystemPrompt"
import { SearchToggle } from "@/components/settings/SearchToggle"
import { useChat } from "@/hooks/useChat"
import type { SendMessageOptions } from "@/hooks/useChat"
import { useConversations } from "@/hooks/useConversations"
import { useHealth } from "@/hooks/useHealth"
import { useDocuments } from "@/hooks/useDocuments"

function ChatLayout() {
  const { messages, isStreaming, isLoading, error, canRetry, sendMessage, retry, conversationId, setConversationId, clearMessages } = useChat()
  const { conversations, addConversation, removeConversation } = useConversations()
  const { status: health } = useHealth()
  const {
    knowledgeSources,
    analyzeFiles,
    loading: docLoading,
    error: docError,
    fetchSources,
    analyzeFile,
    uploadToKnowledge,
    removeSource,
    removeAnalyzeFile,
  } = useDocuments()
  const [selectedSourceIds, setSelectedSourceIds] = useState<number[]>([])
  const [model, setModel] = useState("glm-5.1:cloud")
  const [systemPrompt, setSystemPrompt] = useState<string | null>(null)
  const [searchEnabled, setSearchEnabled] = useState(false)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    fetchSources()
  }, [fetchSources])

  const handleNewChat = async () => {
    clearMessages()
    const conv = await addConversation("New Chat", model, systemPrompt ?? undefined)
    if (conv) {
      setConversationId(conv.id)
    }
  }

  const handleSend = (content: string, options?: SendMessageOptions) => {
    sendMessage(content, model, {
      systemPrompt: systemPrompt ?? undefined,
      enableSearch: searchEnabled,
      imageUrls: options?.imageUrls,
      analysisText: options?.analysisText,
      analysisFileName: options?.analysisFileName,
      knowledgeSourceIds: options?.knowledgeSourceIds,
    })
  }

  const toggleSource = (id: number) => {
    setSelectedSourceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar
        conversations={conversations}
        activeId={conversationId}
        onSelect={(id) => setConversationId(id)}
        onNew={handleNewChat}
        onDelete={removeConversation}
      />

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h1 className="text-lg font-semibold">Ollama Chat UI</h1>
          <div className="flex items-center gap-2 text-xs">
            <span className={health?.ollama ? "text-green-500" : "text-red-500"}>
              Ollama {health?.ollama ? "connected" : "offline"}
            </span>
            <span className={health?.searxng ? "text-green-500" : "text-yellow-500"}>
              Search {health?.searxng ? "available" : "unavailable"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ModelInput model={model} onModelChange={setModel} />
            <SearchToggle enabled={searchEnabled} onToggle={setSearchEnabled} />
            <button
              onClick={toggleTheme}
              className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent transition-colors"
            >
              {theme === "dark" ? "Light" : "Dark"}
            </button>
          </div>
        </header>

        {error && (
          <div className="flex items-center justify-between bg-destructive/10 border-b border-destructive/30 px-4 py-2">
            <span className="text-sm text-destructive">{error}</span>
            {canRetry && (
              <button
                onClick={retry}
                className="text-sm font-medium text-destructive underline hover:no-underline"
              >
                Retry
              </button>
            )}
          </div>
        )}

        <SystemPrompt
          prompt={systemPrompt}
          onPromptChange={setSystemPrompt}
        />

        <ChatView messages={messages} isStreaming={isStreaming} isLoading={isLoading} />
        <ChatInput
          onSend={handleSend}
          disabled={isStreaming}
          analyzeFiles={analyzeFiles}
          knowledgeSources={knowledgeSources}
          selectedSourceIds={selectedSourceIds}
          onAnalyzeFile={analyzeFile}
          onUploadToKnowledge={uploadToKnowledge}
          onRemoveAnalyzeFile={removeAnalyzeFile}
          onRemoveKnowledgeSource={removeSource}
          onToggleSource={toggleSource}
          docLoading={docLoading}
          docError={docError}
        />
      </div>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <ChatLayout />
    </ThemeProvider>
  )
}

export default App