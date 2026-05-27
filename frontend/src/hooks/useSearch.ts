import { useState, useCallback } from "react"
import { search as apiSearch } from "@/lib/api"
import type { SearchResult } from "@/types"

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const doSearch = useCallback(async (query: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiSearch(query)
      setResults(data)
      return data
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Search failed"
      setError(msg)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const clearResults = useCallback(() => {
    setResults([])
    setError(null)
  }, [])

  return { results, loading, error, doSearch, clearResults }
}