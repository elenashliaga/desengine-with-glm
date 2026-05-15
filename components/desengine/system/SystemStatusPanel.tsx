import { Instruction, Resource } from "@/lib/system/types"
import { ResourceCard } from "./ResourceCard"

type SystemStatusPanelProps = {
  resources: Resource[]
  instructions?: Instruction[]
  title?: string
  description?: string
}

function SystemStatusPanel({
  resources,
  instructions=[],
  title="",
  description="",
}: SystemStatusPanelProps) {
  return (
    <div className="flex w-screen">
      <div>
        <h1 className="text-6xl">
          {title}
        </h1>
        <h2 className="text-4xl">
          {description}
        </h2>
      </div>

      <div>
        {resources.map((item) => {
          return (
            <ResourceCard
              key={item.id}
              resource={item}
            />
          )
        })}
      </div>

    </div>
  )
}

export {
  SystemStatusPanel
}