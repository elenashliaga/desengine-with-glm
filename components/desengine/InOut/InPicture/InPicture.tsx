import Image from "next/image";
import { InPictureProps } from "./props";
import { useEffect, useState } from "react";

function ImageCard({
    task,
    image,
}: {
    task: string;
    image: { id: string; src: string; width: number; height: number };
}) {
    const [src, setSrc] = useState(image.src);

    useEffect(() => {
        setSrc(image.src);
    }, [image.src]);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{image.id}.png</p>
                <p className="text-muted-foreground">
                    {image.width}x{image.height}
                </p>
            </div>
            <Image
              src={src}
              alt={`${task}-${image.id}`}
              width={Math.max(image.width, 1)}
              height={Math.max(image.height, 1)}
              unoptimized
              className="h-auto max-w-full rounded-md border"
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
        <div className="flex-1">
            {images[0] ? <ImageCard task={task} image={images[0]} /> : null}
        </div>
    );
}

function LevelTwoInPicture({ task, images }: { task: string; images: Array<{ id: string; src: string; width: number; height: number }> }) {
    return (
        <div className="flex-1 space-y-4">
            {images.map((image) => (
                <ImageCard key={image.id} task={task} image={image} />
            ))}
        </div>
    );
}

function SharedInPicture({ task, images }: { task: string; images: Array<{ id: string; src: string; width: number; height: number }> }) {
    return (
        <div className="flex-1 space-y-4">
            {images.map((image) => (
                <ImageCard key={image.id} task={task} image={image} />
            ))}
        </div>
    );
}

function InPicture({task, taskData}: InPictureProps) {
    const labContext = taskData.labContext;
    const visibleImages = labContext?.images.filter((image) => image.show) ?? [];

    if (!labContext || visibleImages.length === 0) {
        return (
            <div className="flex-1 space-y-4">
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
