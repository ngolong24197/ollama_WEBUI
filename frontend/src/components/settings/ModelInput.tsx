import { useState, useEffect, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import { listModels } from "@/lib/api"

interface ModelInputProps {
  model: string
  onModelChange: (model: string) => void
}

type ValidationState = "idle" | "valid" | "invalid"

export function ModelInput({ model, onModelChange }: ModelInputProps) {
  const [validation, setValidation] = useState<ValidationState>("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  const validate = useCallback(async (value: string) => {
    if (!value.trim()) { setValidation("idle"); return }
    try {
      const models = await listModels()
      const names = models.map((m) => m.name)
      const found = names.some((n) => n.startsWith(value) || n === value)
      if (found) {
        setValidation("valid")
        setErrorMsg("")
      } else {
        setValidation("invalid")
        setErrorMsg(`Model '${value}' not found. Available: ${names.join(", ")}`)
      }
    } catch {
      setValidation("idle")
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onModelChange(e.target.value)
    setValidation("idle")
    setErrorMsg("")
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => validate(e.target.value), 300)
  }

  const handleBlur = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    validate(model)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-foreground">Model</label>
      <div className="relative">
        <input
          type="text"
          value={model}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="e.g. llama3.2"
          className={cn(
            "w-full rounded-lg border bg-background px-3 py-2 text-sm",
            "placeholder:text-muted-foreground focus:outline-none focus:ring-2",
            validation === "invalid"
              ? "border-destructive focus:ring-destructive/50"
              : "border-input focus:ring-ring"
          )}
        />
        {validation === "valid" && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500 text-sm">&#10003;</span>
        )}
      </div>
      {validation === "invalid" && (
        <p className="text-xs text-destructive">{errorMsg}</p>
      )}
    </div>
  )
}