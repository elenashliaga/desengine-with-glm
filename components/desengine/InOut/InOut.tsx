import { BaseStyles } from "../Base";
import { InPicture } from "./InPicture";
import { OutRender } from "./OutRender";
import { InOutProps } from "./props";

function InOut({ task, taskData, started, reloadKey, onStart, startStatus }: InOutProps) {
    return (
        <div className={BaseStyles.frameRow}>
            <InPicture task={task} taskData={taskData} />
            <OutRender
              task={task}
              started={started}
              reloadKey={reloadKey}
              onStart={onStart}
              startStatus={startStatus}
            />
        </div>
    );
}

export {
    InOut,
}
