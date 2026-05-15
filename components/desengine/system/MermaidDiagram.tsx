/**
 * Отрисовка Mermaid-диаграмм
 * npm-пакет:    https://www.npmjs.com/package/mermaid
 * Эксперименты: http://localhost:3000/playground/mermaid
 */

"use client"

import { useEffect, useId, useState } from "react"
import mermaid from "mermaid"

type MermaidDiagramProps = {
  chart: string
  className?: string
}

function MermaidDiagram({ chart, className }: MermaidDiagramProps) {
  const id = useId().replaceAll(":", "")
  const [svg, setSvg] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "default",
    })

    async function renderDiagram() {
      try {
        setError(null)

        const result = await mermaid.render(`mermaid-${id}`, chart)

        if (!cancelled) {
          setSvg(result.svg)
        }
      } catch (err) {
        if (!cancelled) {
          setSvg("")
          setError(err instanceof Error ? err.message : "Mermaid render error")
        }
      }
    }

    renderDiagram()

    return () => {
      cancelled = true
    }
  }, [chart, id])

  if (error) {
    return (
      <pre className={className}>
        {error}
      </pre>
    )
  }

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

export { MermaidDiagram }