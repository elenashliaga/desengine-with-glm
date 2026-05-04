import { getTaskListItems, readTaskData } from "@/lib/server"
import { Lab } from "@/components/desengine/Lab"

export default async function Page() {
    const tasksListItemsAll = await getTaskListItems()

    // отфильтровать список работ по уровню
    // ! Хорошо бы добавить уровни в работы
    // ? А сам уровень откуда берётся?
    const tasksListItemsLevel = tasksListItemsAll;

    const initTaskItem = tasksListItemsLevel[0];   // * потом, возможно, будет сложней логика
    const initTaskData = initTaskItem?.started
      ? await readTaskData(initTaskItem)
      : { taskId: initTaskItem.id, contentByFileId: {}, promptHistory: [] }

    return (
        <Lab
            initTaskItem={initTaskItem}
            initTaskData={initTaskData}
            taskListItems={tasksListItemsAll}
        />
    );
}
