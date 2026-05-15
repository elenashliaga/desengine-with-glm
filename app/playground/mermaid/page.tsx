import { MermaidDiagram } from "@/components/desengine/system/MermaidDiagram"
import { requireAccessOrRedirect } from "@/lib/auth/server"

export default async function Page() {
    await requireAccessOrRedirect("/playground/mermaid")

    const chart = `
    graph TD
    A[Start] --> B[Process]
    B --> C[End]:::red

    classDef red fill:#D65D0E,stroke:#D65D0E,color:#FDF9EC;
    `
    return(
        <MermaidDiagram
            chart={chart}
            className="overflow-x-auto rounded-md bg-white p-4"
        />
    )
}
