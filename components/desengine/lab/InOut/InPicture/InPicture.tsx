import Image from "next/image";
import { useState } from "react";
import type { InPictureProps } from "./props";
import type { TaskLabImage } from "@/lib/platform/types";

function ImageCard({
    task,
    image,
}: {
    task: string;
    image: { id: string; src: string; width: number; height: number };
}) {
    const [src, setSrc] = useState(image.src);

    return (
        <div className="min-w-0">
            <Image
              src={src}
              alt={`${task}-${image.id}`}
              width={Math.max(image.width, 1)}
              height={Math.max(image.height, 1)}
              unoptimized
              className="h-auto max-w-full rounded-md"
              style={{ width: `${Math.max(image.width, 1)}px` }}
              onError={() => {
                  const fallbackSrc = `/api/tasks/${task}/image`;
                  if (image.id === "base" && src !== fallbackSrc) {
                      setSrc(fallbackSrc);
                  }
              }}
            />
        </div>
    );
}

function LevelOneInPicture({ task, images }: { task: string; images: Array<{ id: string; src: string; width: number; height: number }> }) {
    return (
        <div className="min-w-0">
            {images[0] ? <ImageCard key={`${images[0].id}:${images[0].src}`} task={task} image={images[0]} /> : null}
        </div>
    );
}

function LevelTwoInPicture({ task, images }: { task: string; images: Array<{ id: string; src: string; width: number; height: number }> }) {
    return (
        <div className="min-w-0 space-y-4">
            {images.map((image) => (
                <ImageCard key={`${image.id}:${image.src}`} task={task} image={image} />
            ))}
        </div>
    );
}

function SharedInPicture({ task, images }: { task: string; images: Array<{ id: string; src: string; width: number; height: number }> }) {
    return (
        <div className="min-w-0 space-y-4">
            {images.map((image) => (
                <ImageCard key={`${image.id}:${image.src}`} task={task} image={image} />
            ))}
        </div>
    );
}

function InPicture({task, taskData}: InPictureProps) {
    const labContext = taskData.labContext;
    const visibleImages: TaskLabImage[] =
        labContext?.images.filter((image: TaskLabImage) => image.show) ?? [];

    if (!labContext || visibleImages.length === 0) {
        return (
            <div className="min-w-0 space-y-4">
                <ImageCard
                  task={task}
                  image={{
                      id: "base",
                      src: `/api/tasks/${task}/image`,
                      width: 0,
                      height: 0,
                  }}
                />
            </div>
        );
    }

    if (labContext.labId === "level-1") {
        return <LevelOneInPicture task={task} images={visibleImages} />;
    }

    if (labContext.labId === "level-2") {
        return <LevelTwoInPicture task={task} images={visibleImages} />;
    }

    return <SharedInPicture task={task} images={visibleImages} />;
}

export {
    InPicture,
}
