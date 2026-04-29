import { readFile } from "node:fs/promises";
import path from "node:path";
import { Lab } from "../Lab";
import { PageProps } from "./props";
import { LabFileKey } from "../Lab/props";
import { labFiles } from "../Lab/config";

async function Page({task="innovatika-listitem-tariff-option"}: PageProps) {
    const labCodeFiles = labFiles.filter(f => f.edit === true);

    const initialCodeFiles = await Promise.all(
        labCodeFiles.map(async (file) => {
            const filePath = path.join(
                process.cwd(),
                `tasks/${task}`,
                file.fileName
            )
            const content = await readFile(filePath, "utf-8")
            return {
                key: file.key,
                content: content,
            }
        })
    )

    const initialCodeByKey = Object.fromEntries(
        initialCodeFiles.map((file) => [file.key, file.content])
    ) as Record<LabFileKey, string>

    const initialLabData = {
        task: task,
        codeByKey: initialCodeByKey,
    }

    return (
        <div className="bg-white shadow-sm rounded-s flex flex-col gap-2 m-2 p-2">
            <Lab initialLabData={initialLabData} />
        </div>
    );
}

export {
    Page,
}