import { InPictureProps } from "./props";

function InPicture({task}: InPictureProps) {
    return (
        <div className="flex-1">
            <img src={`/api/tasks/${task}/image`} alt={task} />
        </div>
    );
}

export {
    InPicture,
}
