"use client";

import { useEffect, useMemo, useState } from "react";
import { OutRenderProps } from "./props";
import React from "react";

type PreviewComponent = React.ComponentType<Record<string, unknown>>;

function OutRender({ task, started, reloadKey, startStatus }: OutRenderProps) {
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
        <div className="min-w-0">
            {!started ? (
                <div className="space-y-2 py-2">
                    <p className="text-muted-foreground">
                        Превью станет доступно после старта уровня.
                    </p>
                    {startStatus === "starting" && <p className="text-muted-foreground">Генерация файлов…</p>}
                </div>
            ) : (
                <div className="min-h-32 overflow-hidden">
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
