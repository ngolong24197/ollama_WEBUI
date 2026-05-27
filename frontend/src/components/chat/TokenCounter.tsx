import type { Message } from "@/types"

interface TokenCounterProps {
  message: Message
}

export function TokenCounter({ message }: TokenCounterProps) {
  const total = message.promptTokens + message.completionTokens
  if (total === 0) return null

  return (
    <span className="text-xs text-muted-foreground mt-1 block">
      {message.promptTokens} prompt + {message.completionTokens} completion = {total} tokens
    </span>
  )
}