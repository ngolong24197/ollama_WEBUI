interface SessionTokenCountProps {
  totalTokens: number
}

function formatTokens(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")}M tokens`
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1).replace(/\.0$/, "")}k tokens`
  }
  return `${count} tokens`
}

export function SessionTokenCount({ totalTokens }: SessionTokenCountProps) {
  return (
    <span className="text-xs text-muted-foreground/70">
      {formatTokens(totalTokens)}
    </span>
  )
}