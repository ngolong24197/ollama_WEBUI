import { useState, useEffect, useCallback } from "react"
import { checkHealth } from "@/lib/api"
import type { HealthStatus } from "@/types"

export function useHealth() {
  const [status, setStatus] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const check = useCallback(async () => {
    try {
      const result = await checkHealth()
      setStatus(result)
    } catch {
      setStatus({ status: "error", ollama: false, searxng: false })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    check()
    const interval = setInterval(check, 30000)
    return () => clearInterval(interval)
  }, [check])

  return { status, loading, recheck: check }
}