import { useState } from "react"
import { ThemeProvider, useTheme } from "@/components/shared/ThemeProvider"
import { ChatView } from "@/components/chat/ChatView"
import { ChatInput } from "@/components/chat/ChatInput"
import { Sidebar } from "@/components/sidebar/Sidebar"
import { ModelInput } from "@/components/settings/ModelInput"
import { SystemPrompt } from "@/components/settings/SystemPrompt"
import { SearchToggle } from "@/components/settings/SearchToggle"
import { useChat } from "@/hooks/useChat"
import { useConversations } from "@/hooks/useConversations"

function ChatLayout() {
  const { messages, isStreaming, error, sendMessage, conversationId, setConversationId } = useChat()
  const { conversations, addConversation, removeConversation } = useConversations()
  const [model, setModel] = useState("llama3.2")
  const [systemPrompt, setSystemPrompt] = useState<string | null>(null)
  const [searchEnabled, setSearchEnabled] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const handleNewChat = async () => {
    const conv = await addConversation("New Chat", model, systemPrompt ?? undefined)
    if (conv) {
      setConversationId(conv.id)
    }
  }

  const handleSend = (content: string) => {
    sendMessage(content, model, {
      systemPrompt: systemPrompt ?? undefined,
      enableSearch: searchEnabled,
    })
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
          <div className="bg-destructive/10 border-b border-destructive/30 px-4 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <SystemPrompt
          prompt={systemPrompt}
          onPromptChange={setSystemPrompt}
        />

        <ChatView messages={messages} isStreaming={isStreaming} />
        <ChatInput onSend={handleSend} disabled={isStreaming} />
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