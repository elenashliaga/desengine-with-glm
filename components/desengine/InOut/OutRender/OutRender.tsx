"use client";

import React, { type ErrorInfo, useEffect, useMemo, useState } from "react";
import { OutRenderProps } from "./props";

type PreviewComponent = React.ComponentType<Record<string, unknown>>;

function getErrorMessage(error: unknown, fallbackMessage: string) {
    return error instanceof Error && error.message ? error.message : fallbackMessage;
}

function PreviewErrorNotice({ message }: { message: string }) {
    return (
        <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
            <p className="font-medium text-destructive">Не удалось показать превью компонента.</p>
            <pre className="text-destructive whitespace-pre-wrap break-words">{message}</pre>
        </div>
    );
}

type PreviewRenderBoundaryProps = {
    children: React.ReactNode;
};

type PreviewRenderBoundaryState = {
    errorMessage: string | null;
};

class PreviewRenderBoundary extends React.Component<PreviewRenderBoundaryProps, PreviewRenderBoundaryState> {
    state: PreviewRenderBoundaryState = {
        errorMessage: null,
    };

    static getDerivedStateFromError(error: unknown): PreviewRenderBoundaryState {
        return {
            errorMessage: getErrorMessage(error, "Ошибка React-рендера"),
        };
    }

    componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
        console.error("Preview render failed", error);
        console.error(errorInfo.componentStack);
    }

    render() {
        if (this.state.errorMessage) {
            return <PreviewErrorNotice message={this.state.errorMessage} />;
        }

        return this.props.children;
    }
}

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
                setError(getErrorMessage(e, "Ошибка загрузки превью"));
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
                        <PreviewErrorNotice message={error} />
                    ) : Component ? (
                        <PreviewRenderBoundary key={moduleUrl}>
                            <Component {...props} />
                        </PreviewRenderBoundary>
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
