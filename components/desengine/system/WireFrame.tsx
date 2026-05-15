"use client"

import { BaseProps } from "./Base"

type WireFrameProps = BaseProps & {
    code?: string,
}

const baseWireFrameStyle = "inline-block !border-dotted !border-4 !border-purple-300 mx-2 my-2 rounded-xl px-1 py-1"

function WireFrame({
    title,
    code,
    children,
    className="",
} : WireFrameProps) {
    return (
        <div className={`${baseWireFrameStyle} ${className}`}>
            <div className="flex w-full justify-between">
                <div><h1>{title}</h1></div>
                <div><code>{code}</code></div>
            </div>
            {children}
        </div>
    )
}

export {
    WireFrame,
}