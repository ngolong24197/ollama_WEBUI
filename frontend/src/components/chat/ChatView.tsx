import { useEffect, useRef } from "react"
import type { Message } from "@/types"
import { ChatMessage } from "./ChatMessage"

interface ChatViewProps {
  messages: Message[]
  isStreaming: boolean
  isLoading?: boolean
}

export function ChatView({ messages, isStreaming, isLoading }: ChatViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const threshold = 100
      isNearBottomRef.current =
        container.scrollHeight - container.scrollTop - container.clientHeight < threshold
    }

    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Ollama Chat UI</h2>
          <p className="text-sm">Send a message to start chatting</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto">
      {messages.map((msg) => (
        <ChatMessage
          key={msg.id}
          message={msg}
          isStreaming={isStreaming && msg === messages[messages.length - 1] && msg.role === "assistant"}
        />
      ))}
      {isLoading && messages.length === 0 && (
        <div className="flex gap-3 px-4 py-3 justify-start">
          <div className="max-w-[80%] rounded-lg bg-card border border-border px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse" />
              <div className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse [animation-delay:0.2s]" />
              <div className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse [animation-delay:0.4s]" />
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}