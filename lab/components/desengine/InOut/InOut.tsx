import { BaseStyles } from "../Base";
import { InPicture } from "./InPicture";
import { OutRender } from "./OutRender";
import { InOutProps } from "./props";

function InOut({ task, started, reloadKey, onStart, startStatus, startError }: InOutProps) {
    return (
        <div className={BaseStyles.frameRow}>
            <InPicture task={task} />
            <OutRender
              task={task}
              started={started}
              reloadKey={reloadKey}
              onStart={onStart}
              startStatus={startStatus}
              startError={startError}
            />
        </div>
    );
}

export {
    InOut,
}
