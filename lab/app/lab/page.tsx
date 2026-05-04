import { getTaskListItems, readTaskData } from "@/lib"
import { Lab } from "@/components/desengine/Lab"

export default async function Page() {
    const tasksListItemsAll = await getTaskListItems()

    // отфильтровать список работ по уровню
    // ! Хорошо бы добавить уровни в работы
    // ? А сам уровень откуда берётся?
    const tasksListItemsLevel = tasksListItemsAll;

    const initTaskItem = tasksListItemsLevel[0];   // * потом, возможно, будет сложней логика
    const initTaskData = await readTaskData(initTaskItem)

    return (
        <Lab
            initTaskItem={initTaskItem}
            initTaskData={initTaskData}
            taskListItems={tasksListItemsAll}
        />
    );
}