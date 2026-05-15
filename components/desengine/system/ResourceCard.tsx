import { Resource } from "@/lib/system/types"
import { BaseProps } from "./Base"
import { WireFrame } from "./WireFrame"
import { ResourceStateBullet } from "./ResourceStateBullet"

type ResourceCardProps = BaseProps & {
    resource: Resource,
}

function ResourceCard({
    resource
} : ResourceCardProps) {
    return (
        <div className="grid grid-cols-[max-content_1fr] w-full items-center gap-x-2">
            <ResourceStateBullet state={resource.state} className="flex-1"/>
            <div className="text-2xl">{resource.label}</div>

            <div />
            <div>{resource.summary}</div>

            <div />
            <div>{resource.detail}</div>
        </div>
    )
}

export {
  ResourceCard
}