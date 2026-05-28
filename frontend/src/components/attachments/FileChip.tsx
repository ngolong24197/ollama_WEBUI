interface FileChipProps {
  name: string
  onRemove: () => void
}

export function FileChip({ name, onRemove }: FileChipProps) {
  const truncated = name.length > 30 ? name.slice(0, 27) + "..." : name
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6" />
      </svg>
      {truncated}
      <button
        onClick={onRemove}
        className="ml-0.5 rounded-sm hover:bg-destructive/20 hover:text-destructive"
      >
        ×
      </button>
    </span>
  )
}