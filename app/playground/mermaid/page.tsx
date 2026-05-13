import { MermaidDiagram } from "@/components/desengine/platform/renders/MermaidDiagram"

export default function Page() {
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