import { ResourceState } from "@/lib/system/types"
import { BaseProps } from "./Base"
import { Badge } from "@/components/ui/badge"

const ResourceStateBulletVariants = {
  ready: {
    className: "border-lime-600 bg-lime-600 text-white",
    sign: "•",
  },
  warning: {
    className: "border-amber-500 bg-amber-500 text-white",
    sign: "?",
  },
  blocked: {
    className: "border-red-700 bg-red-700 text-white",
    sign: "!",
  },
} as const

type ResourceStateBulletProps = BaseProps & {
    state: ResourceState,
}

function ResourceStateBullet({
    state
} : ResourceStateBulletProps) {

    return (
        <Badge className={ResourceStateBulletVariants[state].className}>
            {ResourceStateBulletVariants[state].sign}
        </Badge>
    )
}

export {
    ResourceStateBullet
}