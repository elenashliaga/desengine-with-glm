import { InPictureProps } from "./props";

function InPicture({task}: InPictureProps) {
    return (
        <div className="flex-1">
            <img src={`/tasks/${task}.png`} />
        </div>
    );
}

export {
    InPicture,
}