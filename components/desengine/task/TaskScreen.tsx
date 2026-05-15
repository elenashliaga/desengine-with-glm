import { WireFrame } from "../system/WireFrame"

type TaskScreenProps = {
    taskId: string,
}

function TaskScreen ({
    taskId,
} : TaskScreenProps) {
    return (
        <WireFrame title="Экран задачи" code={`<TaskScreen taskId=${taskId} />`}>
            <WireFrame title="Прогресс по задаче">
                <WireFrame title="Линейка прогресса" />
                <WireFrame title="Ссылка на уровень" />
                <WireFrame title="Описание уровня" />
                <WireFrame title="Сколько осталось промптов на уровне" />
            </WireFrame>
            <WireFrame title="Переход в лабораторию" />

            <WireFrame title="Доступный набор картинок" className="w-full"/>

            <WireFrame title="Рендер нынешнего состояния (если есть)" />
            <WireFrame title="Просмотр кода (без редактирования)" />
            <WireFrame title="История задачи" className="flex w-full">
                <WireFrame title="Подсказки пройденных уровней"/>
                <WireFrame title="История промптов"/>
            </WireFrame>
            <WireFrame title="Бейджи (или теги?)" />
            <WireFrame title="Задать вопрос по задаче" />
            <WireFrame title="Заметка для себя" />
        </WireFrame>
    )
}

export {
    TaskScreen
}