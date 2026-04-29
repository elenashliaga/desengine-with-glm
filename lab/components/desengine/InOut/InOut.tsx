import { BaseStyles } from "../Base";
import { InPicture } from "./InPicture";
import { OutRender } from "./OutRender";
import { InOutProps } from "./props";

function InOut({task}: InOutProps) {
    return (
        <div className={BaseStyles.frameRow}>
            <InPicture task={task} />
            <OutRender task={task} />
        </div>
    );
}

export {
    InOut,
}