import { InPicture } from "./InPicture";
import { OutRender } from "./OutRender";
import { InOutProps } from "./props";

function InOut({ task, taskData, started, reloadKey, startStatus }: InOutProps) {
    return (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <InPicture task={task} taskData={taskData} />
            <OutRender
              task={task}
              started={started}
              reloadKey={reloadKey}
              startStatus={startStatus}
            />
        </div>
    );
}

export {
    InOut,
}
