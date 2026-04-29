import { OutRenderProps } from "./props";

function OutRender({task}: OutRenderProps) {
    return (
        <div className="flex-1">
            {task}
        </div>
    );
}

export {
    OutRender,
}