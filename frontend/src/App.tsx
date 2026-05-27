import { useState } from "react"
import { ThemeProvider, useTheme } from "@/components/shared/ThemeProvider"
import { ChatView } from "@/components/chat/ChatView"
import { ChatInput } from "@/components/chat/ChatInput"
import { useChat } from "@/hooks/useChat"

function ChatLayout() {
  const { messages, isStreaming, error, sendMessage } = useChat()
  const [model, setModel] = useState("llama3.2")
  const { theme, toggleTheme } = useTheme()

  const handleSend = (content: string) => {
    sendMessage(content, model)
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h1 className="text-lg font-semibold">Ollama Chat UI</h1>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Model name"
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-44"
          />
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

      <ChatView messages={messages} isStreaming={isStreaming} />
      <ChatInput onSend={handleSend} disabled={isStreaming} />
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