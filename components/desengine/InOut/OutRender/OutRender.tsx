"use client";

import { useEffect, useMemo, useState } from "react";
import TaskStart from "../../TaskStart/TaskStart";
import { OutRenderProps } from "./props";
import React from "react";

type PreviewComponent = React.ComponentType<Record<string, unknown>>;

function OutRender({ task, started, reloadKey, onStart, startStatus }: OutRenderProps) {
    const [error, setError] = useState<string>("");
    const [Component, setComponent] = useState<PreviewComponent | null>(null);
    const [props, setProps] = useState<Record<string, unknown>>({});

    const moduleUrl = useMemo(
        () => `/api/tasks/${task}/module?v=${reloadKey}`,
        [task, reloadKey],
    );

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setError("");
            setComponent(null);
            setProps({});

            if (!started) return;

            try {
                const res = await fetch(moduleUrl, { method: "GET", cache: "no-store" });
                const data = await res.json().catch(() => null);

                if (!res.ok || !data?.ok) {
                    throw new Error(data?.error || "Ошибка загрузки модуля");
                }

                const js = String(data.module || "");
                const exportsObj: Record<string, unknown> = {};
                const moduleObj: { exports: unknown } = { exports: exportsObj };
                const fn = new Function("React", "module", "exports", js);
                fn(React, moduleObj, exportsObj);

                if (cancelled) return;

                const moduleExports = moduleObj.exports as { default?: unknown } | undefined;
                const maybe = moduleExports?.default || exportsObj.default || moduleObj.exports;
                if (typeof maybe !== "function") {
                    throw new Error("Component.tsx не экспортирует React-компонент по умолчанию");
                }

                setComponent(() => maybe as PreviewComponent);
                setProps((data.props && typeof data.props === "object") ? data.props : {});
            } catch (e) {
                if (cancelled) return;
                setError(e instanceof Error ? e.message : "Ошибка рендера");
            }
        }

        load();
        return () => { cancelled = true; };
    }, [moduleUrl, started]);

    return (
        <div className="flex-1">
            {!started ? (
                <div className="space-y-3">
                    <TaskStart
                      task={{
                        id: task,
                        image: { width: 0, height: 0 },
                        started: false,
                        maxLevel: 1,
                        progress: {
                          currentLevel: 1,
                          currentLevelId: "level-1",
                          currentLevelStatus: "available",
                          currentLevelInitialized: false,
                          promptsUsed: 0,
                          promptsLimit: 0,
                          maxLevel: 1,
                          isCompleted: false,
                          hasNextLevel: false,
                        },
                      }}
                      onStarted={onStart}
                    />
                    {startStatus === "starting" && (
                        <p className="text-muted-foreground">Генерация файлов…</p>
                    )}
                </div>
            ) : (
                <div className="rounded-md border bg-background p-3 min-h-32">
                    {error ? (
                        <pre className="text-destructive whitespace-pre-wrap">{error}</pre>
                    ) : Component ? (
                        <Component {...props} />
                    ) : (
                        <p className="text-muted-foreground">Загрузка рендера…</p>
                    )}
                </div>
            )}
        </div>
    );
}

export {
    OutRender,
}
