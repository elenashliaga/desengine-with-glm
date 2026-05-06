type StatusItem = {
  id: string
  label: string
  tone: "ready" | "warning" | "blocked"
  summary: string
  detail: string
}

type Instruction = {
  id: string
  actor: "Пользователь" | "Администратор"
  text: string
}

type SystemStatusPanelProps = {
  statusItems: StatusItem[]
  instructions: Instruction[]
  title: string
  description: string
}

function getStatusClasses(tone: StatusItem["tone"]) {
  if (tone === "ready") {
    return {
      badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
    }
  }

  if (tone === "warning") {
    return {
      badge: "border-amber-200 bg-amber-50 text-amber-800",
      dot: "bg-amber-500",
    }
  }

  return {
    badge: "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-500",
  }
}

export function SystemStatusPanel({
  statusItems,
  instructions,
  title,
  description,
}: SystemStatusPanelProps) {
  return (
    <div className="space-y-7">
      <div className="space-y-4">
        <h1 className="max-w-3xl font-semibold text-black">
          {title}
        </h1>
        <p className="max-w-2xl text-black/65">
          {description}
        </p>
      </div>

      <div className="tool-status-grid">
        {statusItems.map((item) => {
          const classes = getStatusClasses(item.tone)

          return (
            <article key={item.id} className="tool-status-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium uppercase text-black/45">
                    {item.label}
                  </p>
                  <h2 className="mt-2 font-semibold text-black">{item.summary}</h2>
                </div>
                <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 font-medium ${classes.badge}`}>
                  <span className={`size-2 rounded-full ${classes.dot}`} />
                  {item.tone === "ready" ? "Готово" : item.tone === "warning" ? "Проверить" : "Нужно настроить"}
                </span>
              </div>
              <p className="mt-3 text-black/60">{item.detail}</p>
            </article>
          )
        })}
      </div>

      <div className="tool-status-panel">
        <div className="space-y-2">
          <h2 className="font-semibold text-black">Что делать дальше</h2>
          <p className="text-black/60">
            Ниже показаны ближайшие шаги для пользователя и администратора. Пользовательский путь остаётся браузерным,
            а техническая настройка относится к админскому контуру.
          </p>
        </div>

        <div className="mt-4 space-y-3">
          {instructions.map((instruction) => (
            <div key={instruction.id} className="tool-status-step">
              <span className="font-semibold text-black">{instruction.actor}:</span> {instruction.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export type { Instruction, StatusItem }
