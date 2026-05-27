import { useEffect, useRef } from "react"
import type { Message } from "@/types"
import { ChatMessage } from "./ChatMessage"

interface ChatViewProps {
  messages: Message[]
  isStreaming: boolean
}

export function ChatView({ messages, isStreaming }: ChatViewProps) {
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

  if (messages.length === 0) {
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
      <div ref={bottomRef} />
    </div>
  )
}