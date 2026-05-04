import { readFile } from "node:fs/promises";
import path from "node:path";
import { Lab } from "../LabWorkbench";
import { PageProps } from "./props";
import { LabFileKey } from "../LabWorkbench/props";
import { labFiles } from "../LabWorkbench/config";

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
        <main className="bg-white shadow-sm rounded-s flex flex-col gap-2 m-2 p-2">
            <Lab initialLabData={initialLabData} />
        </main>
    );
}

export {
    Page,
}